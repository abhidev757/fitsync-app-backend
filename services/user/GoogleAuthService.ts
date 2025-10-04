import { OAuth2Client } from 'google-auth-library';
import { IUser } from '../../types/user.types';
import User from '../../models/UserModel';
import crypto from 'crypto';
import { fitness_v1, google } from 'googleapis';
import HealthDataModel from '../../models/HealthDataModel';

export class GoogleAuthService {
  private client: OAuth2Client;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      return ticket.getPayload();
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  async findOrCreateUser(payload: any): Promise<IUser> {
    try {
      if (!payload?.email) {
        throw new Error('No email found in Google payload');
      }

      let user = await User.findOne({ email: payload.email });
      
      if (!user) {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          password: crypto.randomBytes(16).toString('hex'),
          status: true,
          isGoogleLogin: true,
          googleId: payload.sub,
        });
      } else {
        user = await User.findOneAndUpdate(
          { email: payload.email },
          { isGoogleLogin: true },
          { new: true }
        );
      }

      if (!user) throw new Error('User operation failed');
      return user;
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw new Error('Error processing Google user data');
    }
  }

  async exchangeCodeAndSaveFitTokens(
  code: string,
  userId: string,
  redirectUri: string
): Promise<void> {
  if (!code) throw new Error('Authorization code is required');
  if (!userId) throw new Error('UserId is required');
  if (!redirectUri) throw new Error('Redirect URI is required');

  // Defensive: ensure env vars exist
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google client id/secret not configured');
  }

  try {
    // Create OAuth client with client_id + client_secret + redirectUri
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange the code (pass code string)
    const { tokens } = await client.getToken(code);
    // tokens = { access_token, refresh_token?, expiry_date?, ... }

    if (!tokens || !tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Prepare update object: always set accessToken and expiry
    const updateData: any = {
      googleTokens: {
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date || null,
      },
    };

    // If Google returned a refresh token, persist it.
    // If not returned, DO NOT overwrite an existing stored refresh token with null.
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    if (tokens.refresh_token) {
      updateData.googleTokens.refreshToken = tokens.refresh_token;
    } else if (user.googleTokens?.refreshToken) {
      // preserve existing refresh token
      updateData.googleTokens.refreshToken = user.googleTokens.refreshToken;
    }

    await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).exec();

    // Optionally set credentials in memory for immediate use:
    client.setCredentials(updateData.googleTokens);
  } catch (err) {
    console.error('Google token exchange error:', err);
    // Re-throw so controller can return an appropriate error to the client
    throw err;
  }
}


  async fetchAndSaveGoogleFitData(userId: string) {
  try {
    // Load user with tokens
    const user = await User.findById(userId).lean();
    if (!user?.googleTokens?.refreshToken) {
      throw new Error('Google Fit not connected - missing refresh token');
    }

    // Ensure we have a properly constructed oauth2Client (with client ID & secret)
    // If your constructor didn't include secret, construct a local client here:
    if (!this.oauth2Client || !this.oauth2Client.credentials) {
      this.oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
    }

    // Set refresh token so client can refresh access tokens automatically
    this.oauth2Client.setCredentials({ refresh_token: user.googleTokens.refreshToken });

    const fitness = google.fitness({ version: 'v1', auth: this.oauth2Client });

    const now = Date.now();
    // Calendar-day window for steps & calories
    const startOfDay = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
    const stepsCaloriesStart = startOfDay;
    const stepsCaloriesEnd = now;

    // Expanded window for sleep
    const sleepWindowStart = startOfDay - 16 * 60 * 60 * 1000; // 16 hours before midnight
    const sleepWindowEnd = now;

    // Preferred requests (try derived / aggregated sources first)
    const preferredStepsCaloriesReq = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta', dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:aggregated' },
        { dataTypeName: 'com.google.calories.expended', dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:aggregated' },
      ],
      bucketByTime: { durationMillis: stepsCaloriesEnd - stepsCaloriesStart },
      startTimeMillis: stepsCaloriesStart,
      endTimeMillis: stepsCaloriesEnd,
    };

    const safeStepsCaloriesReq = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.calories.expended' },
      ],
      bucketByTime: { durationMillis: stepsCaloriesEnd - stepsCaloriesStart },
      startTimeMillis: stepsCaloriesStart,
      endTimeMillis: stepsCaloriesEnd,
    };

    const preferredSleepReq = {
      aggregateBy: [
        { dataTypeName: 'com.google.sleep.segment', dataSourceId: 'derived:com.google.sleep.segment:com.google.android.gms:merged' }
      ],
      bucketByTime: { durationMillis: sleepWindowEnd - sleepWindowStart },
      startTimeMillis: sleepWindowStart,
      endTimeMillis: sleepWindowEnd,
    };

    const safeSleepReq = {
      aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
      bucketByTime: { durationMillis: sleepWindowEnd - sleepWindowStart },
      startTimeMillis: sleepWindowStart,
      endTimeMillis: sleepWindowEnd,
    };

    // Helper (arrow) to attempt preferred, returning an object { success: boolean, response?, reason? }
    const tryAggregate = async (requestBody: any) => {
      try {
        const resp = await fitness.users.dataset.aggregate({ userId: 'me', requestBody });
        return { success: true, response: resp };
      } catch (err: any) {
        const msg = err?.errors?.[0]?.message || err?.message || String(err);
        // If it's a datasource not readable error, signal fallback
        if (String(msg).toLowerCase().includes('datasource') || err?.code === 403) {
          return { success: false, reason: msg };
        }
        // Unexpected error - rethrow
        throw err;
      }
    };

    // 1) Steps & calories: preferred then fallback
    let scResult = await tryAggregate(preferredStepsCaloriesReq);
    if (!scResult.success) {
      console.warn('Preferred steps/calories datasource failed:', scResult.reason);
      scResult = await tryAggregate(safeStepsCaloriesReq);
      if (!scResult.success) {
        // If fallback also failed (unlikely), rethrow with message
        throw new Error('Steps/calories aggregation failed: ' + (scResult.reason || 'unknown'));
      }
    }
    const scResponse = scResult.response;
    if (!scResponse || !scResponse.data) {
      throw new Error('Empty response from steps/calories aggregate');
    }

    // Parse steps & calories
    let steps = 0;
    let calories = 0;
    for (const bucket of scResponse.data.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          const dtype = point.dataTypeName || '';
          if (dtype === 'com.google.step_count.delta') {
            for (const v of point.value || []) {
              if (typeof v.intVal === 'number') steps += v.intVal;
              else if (typeof v.fpVal === 'number') steps += Math.round(v.fpVal);
            }
          } else if (dtype === 'com.google.calories.expended') {
            for (const v of point.value || []) {
              if (typeof v.fpVal === 'number') calories += v.fpVal;
              else if (typeof v.intVal === 'number') calories += v.intVal;
            }
          }
        }
      }
    }
    calories = Math.round(calories);

    // 2) Sleep: preferred then fallback
    let sleepResult = await tryAggregate(preferredSleepReq);
    if (!sleepResult.success) {
      console.warn('Preferred sleep datasource failed:', sleepResult.reason);
      sleepResult = await tryAggregate(safeSleepReq);
      if (!sleepResult.success) {
        // If fallback also failed, we still continue to try sessions fallback below
        console.warn('Safe sleep aggregate failed:', sleepResult.reason);
      }
    }
    const sleepResponse = sleepResult.response;
    const sleepIntervals: Array<{ start: number; end: number }> = [];

    if (sleepResponse && sleepResponse.data) {
      for (const bucket of sleepResponse.data.bucket || []) {
        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            if (point.startTimeNanos && point.endTimeNanos) {
              const s = Number(point.startTimeNanos) / 1e6; // ns -> ms
              const e = Number(point.endTimeNanos) / 1e6;
              if (e > s) sleepIntervals.push({ start: s, end: e });
            }
          }
        }
      }
    }

    // 3) Sessions fallback (only if we didn't get sleep segments)
    if (sleepIntervals.length === 0) {
      try {
        const sessionsRes = await fitness.users.sessions.list({
          userId: 'me',
          startTime: new Date(sleepWindowStart).toISOString(),
          endTime: new Date(sleepWindowEnd).toISOString(),
        });
        const sessions = sessionsRes.data.session || [];
        for (const s of sessions) {
          const name = (s.name || '').toLowerCase();
          const desc = (s.description || '').toLowerCase();
          const activityType = s.activityType;
          const looksLikeSleep = name.includes('sleep') || desc.includes('sleep') || activityType === 72;
          if (looksLikeSleep && s.startTimeMillis && s.endTimeMillis) {
            const sStart = Number(s.startTimeMillis);
            const sEnd = Number(s.endTimeMillis);
            if (sEnd > sStart) sleepIntervals.push({ start: sStart, end: sEnd });
          }
        }
      } catch (err) {
        console.warn('Sessions fallback error (non-fatal):', err);
      }
    }

    // 4) Merge overlapping intervals and sum minutes
    const mergeAndSumMinutes = (intervals: Array<{ start: number; end: number }>) => {
      if (!intervals.length) return 0;
      intervals.sort((a, b) => a.start - b.start);
      const merged: Array<{ start: number; end: number }> = [];
      let cur = intervals[0];
      for (let i = 1; i < intervals.length; i++) {
        const it = intervals[i];
        if (it.start <= cur.end) {
          cur.end = Math.max(cur.end, it.end);
        } else {
          merged.push(cur);
          cur = it;
        }
      }
      merged.push(cur);
      let totalMs = 0;
      for (const m of merged) totalMs += (m.end - m.start);
      return Math.floor(totalMs / 60000); // minutes
    };

    const sleepMinutes = mergeAndSumMinutes(sleepIntervals);
    const sleepHours = Math.round((sleepMinutes / 60) * 100) / 100;

    // Save to DB using expected fields
    const today = new Date().toISOString().split('T')[0];
    const saved = await HealthDataModel.findOneAndUpdate(
      { userId, date: today },
      {
        steps,
        caloriesBurned: calories,
        sleepHours,
        source: 'GoogleFit',
      },
      { upsert: true, new: true }
    );

    // Return the saved document
    return saved;
  } catch (error) {
    console.error('Google Fit data fetch error:', error);
    // Bubble up so the controller can decide what HTTP response to send
    throw error;
  }


  }
}
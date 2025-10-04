export interface IFitnessData {
    userId: string;
    date: string;
    steps: number;
    sleepHours: number;
    caloriesBurned: number;
    source?: 'GoogleFit';
  }
  
  export interface HealthData { steps: number; calories: number; sleepMinutes: number };
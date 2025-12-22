import { injectable } from "inversify";
import User from "../../models/UserModel";
import { IUser } from "../../types/user.types";
import { BaseRepository } from "../base/BaseRepository";
import { IAuthRepository } from "../../interfaces/user/repositories/IAuthRepository";

@injectable()
export class AuthRepository extends BaseRepository<IUser> implements IAuthRepository {
    private readonly UserModel = User;

    constructor() { super(User); }

    async findById(id: string): Promise<IUser | null> {
        try {
            return await this.UserModel.findById(id);
        } catch (error) {
            console.error("Error finding User by ID:", error);
            throw new Error("Failed to find User");
        }
    }

    async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
        try {
            return await this.UserModel.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true }
            );
        } catch (error) {
            console.error("Error updating user:", error);
            throw new Error("Failed to update user");
        }
    }

    async findByEmail(email: string): Promise<IUser | null> {
        try {
            return await this.UserModel.findOne({ email });
        } catch (err) {
            console.error("Error finding User by email:", err);
            throw new Error("Failure to find User by email");
        }
    }

    async register(userData: IUser): Promise<IUser | null> {
        try {
            const user = new this.UserModel(userData);
            return await user.save();
        } catch (err) {
            console.error("Error registering user:", err);
            throw new Error("Failed to register User");
        }
    }

    async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
        try {
            await this.UserModel.findByIdAndUpdate(userId, { password: newHashedPassword });
        } catch (error) {
            console.error("Error updating password:", error);
            throw new Error("Failed to update password");
        }
    }
}
import { Model } from "mongoose";
import { IBaseRepository } from "../../interfaces/admin/base/IBaseRepository";

export class BaseRepository<T> implements IBaseRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async createNewData(data: Partial<T>): Promise<T> {
    console.log('Base repository created')
    return await this.model.create(data);
  }

  async findOneById(id: string): Promise<T | null> {
    console.log('Base repository findById')
    return await this.model.findById(id).exec();
  }

  async findAllData(): Promise<T[]> {
    console.log('Base repository findAll')
    return await this.model.find().exec();
  }

  async updateOneById(id: string, data: Partial<T>): Promise<T | null> {
    console.log('Base repository Update')
    return await this.model.findByIdAndUpdate(id, { $set: data }, { new: true })
  }

  async deleteOneById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

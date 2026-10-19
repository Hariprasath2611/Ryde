export interface IDriverRepository {
  findById(id: string): Promise<unknown>;
  update(id: string, data: unknown): Promise<unknown>;
}

export class DriverRepository implements IDriverRepository {
  async findById(_id: string): Promise<unknown> {
    return null;
  }

  async update(_id: string, _data: unknown): Promise<unknown> {
    return null;
  }
}

export const driverRepository = new DriverRepository();

export interface ITripsRepository {
  findById(id: string): Promise<unknown>;
  updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<unknown>;
}

export class TripsRepository implements ITripsRepository {
  async findById(_id: string): Promise<unknown> {
    return null;
  }

  async updateStatus(
    _id: string,
    _status: string,
    _metadata?: Record<string, unknown>,
  ): Promise<unknown> {
    return null;
  }
}

export const tripsRepository = new TripsRepository();

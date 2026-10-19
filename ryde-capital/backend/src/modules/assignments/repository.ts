export interface IAssignmentsRepository {
  findActiveByDriverId(driverId: string): Promise<unknown[]>;
  updateStatus(id: string, status: string): Promise<unknown>;
}

export class AssignmentsRepository implements IAssignmentsRepository {
  async findActiveByDriverId(_driverId: string): Promise<unknown[]> {
    return [];
  }

  async updateStatus(_id: string, _status: string): Promise<unknown> {
    return null;
  }
}

export const assignmentsRepository = new AssignmentsRepository();

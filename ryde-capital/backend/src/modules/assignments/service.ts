import { NotImplementedError } from '@ryde/shared';

export class AssignmentsService {
  async listAssignments(_driverId: string): Promise<never> {
    throw new NotImplementedError('Assignment listing is not implemented yet');
  }

  async acceptAssignment(_driverId: string, _assignmentId: string): Promise<never> {
    throw new NotImplementedError('Assignment acceptance is not implemented yet');
  }

  async rejectAssignment(_driverId: string, _assignmentId: string, _reason?: string): Promise<never> {
    throw new NotImplementedError('Assignment rejection is not implemented yet');
  }
}

export const assignmentsService = new AssignmentsService();

import { NotImplementedError } from '@ryde/shared';

export class EarningsService {
  async getEarnings(_driverId: string, _query?: unknown): Promise<never> {
    throw new NotImplementedError('Earnings retrieval is not implemented yet');
  }
}

export const earningsService = new EarningsService();

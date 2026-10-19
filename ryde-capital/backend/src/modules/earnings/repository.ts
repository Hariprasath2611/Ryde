export interface IEarningsRepository {
  getEarningsSummary(driverId: string, options?: unknown): Promise<unknown>;
}

export class EarningsRepository implements IEarningsRepository {
  async getEarningsSummary(_driverId: string, _options?: unknown): Promise<unknown> {
    return null;
  }
}

export const earningsRepository = new EarningsRepository();

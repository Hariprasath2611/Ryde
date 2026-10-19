// ryde-capital/backend/src/modules/complaints/service.ts
// Phase 5: Complaints Service

import {
  complaintsRepository,
  type IComplaintsRepository,
} from './repository.js';
import type { CreateComplaintInput, GetComplaintsQueryInput } from './schema.js';

export class ComplaintsService {
  constructor(private repo: IComplaintsRepository = complaintsRepository) {}

  async fileComplaint(userId: string, input: CreateComplaintInput) {
    const complaint = await this.repo.createComplaint({
      trip_id: input.tripId || null,
      reported_by: userId,
      complaint_type: input.complaintType,
      description: input.description,
    });

    return complaint;
  }

  async getComplaints(userId: string, query: GetComplaintsQueryInput) {
    const { complaints, total } = await this.repo.getComplaints(
      userId,
      query.page,
      query.limit,
      query.status,
    );

    return {
      complaints,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}

export const complaintsService = new ComplaintsService();

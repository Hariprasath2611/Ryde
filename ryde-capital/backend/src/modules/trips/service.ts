import { NotImplementedError } from '@ryde/shared';

export class TripsService {
  async getTrip(_tripId: string): Promise<never> {
    throw new NotImplementedError('Trip retrieval is not implemented yet');
  }

  async markArrived(_tripId: string): Promise<never> {
    throw new NotImplementedError('Trip arrival is not implemented yet');
  }

  async generateOtp(_tripId: string): Promise<never> {
    throw new NotImplementedError('Trip OTP generation is not implemented yet');
  }

  async verifyOtp(_tripId: string, _otp: string): Promise<never> {
    throw new NotImplementedError('Trip OTP verification is not implemented yet');
  }

  async recordHandover(_tripId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('Vehicle handover is not implemented yet');
  }

  async startTrip(_tripId: string): Promise<never> {
    throw new NotImplementedError('Trip start is not implemented yet');
  }

  async endTrip(_tripId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('Trip end is not implemented yet');
  }
}

export const tripsService = new TripsService();

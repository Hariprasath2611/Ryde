import { describe, it, expect } from 'vitest';
import {
  ROLES,
  BOOKING_STATUS,
  TRIP_STATUS,
  ASSIGNMENT_STATUS,
  VERIFICATION_STATUS,
  VEHICLE_TYPE,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  NotImplementedError,
  createLogger,
  createSupabaseServiceClient,
} from '../src/index.js';

describe('Shared Package: Constants & Lib', () => {
  it('should export all required role constants', () => {
    expect(ROLES.DRIVER).toBe('driver');
    expect(ROLES.CUSTOMER).toBe('customer');
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.SUPPORT).toBe('support');
  });

  it('should export all required lifecycle statuses and vehicle types', () => {
    expect(BOOKING_STATUS.PENDING).toBe('pending');
    expect(TRIP_STATUS.STARTED).toBe('started');
    expect(ASSIGNMENT_STATUS.OFFERED).toBe('offered');
    expect(VERIFICATION_STATUS.VERIFIED).toBe('verified');
    expect(VEHICLE_TYPE.TWO_WHEELER).toBe('two_wheeler');
    expect(VEHICLE_TYPE.THREE_WHEELER).toBe('three_wheeler');
    expect(VEHICLE_TYPE.FOUR_WHEELER).toBe('four_wheeler');
  });

  it('should create proper AppError subclasses with correct status codes', () => {
    const badReq = new BadRequestError('Invalid input');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.code).toBe('BAD_REQUEST');
    expect(badReq instanceof AppError).toBe(true);

    const unauthorized = new UnauthorizedError();
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe('UNAUTHORIZED');

    const forbidden = new ForbiddenError();
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.code).toBe('FORBIDDEN');

    const notFound = new NotFoundError();
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe('NOT_FOUND');

    const conflict = new ConflictError();
    expect(conflict.statusCode).toBe(409);
    expect(conflict.code).toBe('CONFLICT');

    const notImplemented = new NotImplementedError();
    expect(notImplemented.statusCode).toBe(501);
    expect(notImplemented.code).toBe('NOT_IMPLEMENTED');
  });

  it('should instantiate logger successfully', () => {
    const testLogger = createLogger({ serviceName: 'test-service' });
    expect(testLogger).toBeDefined();
    expect(typeof testLogger.info).toBe('function');
  });

  it('should throw when creating Supabase service client without credentials', () => {
    expect(() => createSupabaseServiceClient('', '')).toThrow();
  });
});

/**
 * Ryde Capital Unified API Layer
 * Defaults to mock API for local development and offline preview.
 * Can be switched to production backend by setting EXPO_PUBLIC_USE_MOCKS=false.
 */

import { mockApi } from './mock';
export * from './types';
export { mockApi } from './mock';

export const isUsingMocks = process.env['EXPO_PUBLIC_USE_MOCKS'] !== 'false';

export const api = mockApi;
export default api;

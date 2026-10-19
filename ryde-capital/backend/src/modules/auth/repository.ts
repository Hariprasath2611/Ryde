import { supabaseServiceClient } from '../../config/supabase.js';

export interface IAuthRepository {
  getUserById(id: string): Promise<unknown>;
}

export class AuthRepository implements IAuthRepository {
  async getUserById(id: string): Promise<unknown> {
    const { data, error } = await supabaseServiceClient.auth.admin.getUserById(id);
    if (error) throw error;
    return data.user;
  }
}

export const authRepository = new AuthRepository();

import { User } from '../@types/entities';

export class AuthViewModel {
  static registerToHttp(user: User, accessToken: string) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      accessToken,
    };
  }

  static loginToHttp(user: User, accessToken: string) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      accessToken,
    };
  }
}

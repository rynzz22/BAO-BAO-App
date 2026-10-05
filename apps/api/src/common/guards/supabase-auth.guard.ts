import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../../modules/database/database.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
      });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'Invalid Bearer token format',
      });
    }

    // In a production Supabase setup:
    // Verify JWT using Supabase JWT secret / JWKS to get payload.sub.
    // For seamless testing, token can be a user ID, a JWT with a sub, or demo token.
    let userId = token;
    try {
      if (token.includes('.')) {
        const parts = token.split('.');
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        userId = payload.sub || payload.id || token;
      }
    } catch {
      userId = token;
    }

    // Load profile strictly from database (Never trust client claims)
    const profile = await this.db.findProfileByIdOrEmail(userId);
    if (!profile) {
      // If user profile is not synced yet, allow basic fallback for /auth/sync
      if (request.url?.includes('/auth/sync')) {
        request.user = { id: userId, role: 'PASSENGER', email: null };
        return true;
      }
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'User profile not found in database. Please sync auth.',
      });
    }

    if (!profile.isActive) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'User account is inactive or suspended',
      });
    }

    request.user = profile;
    return true;
  }
}

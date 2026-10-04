import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(error: any, usuario: any, informacion: any) {
    if (error || !usuario) {
      throw new UnauthorizedException(
        informacion?.message || error?.message || 'Token inválido',
      );
    }

    return usuario;
  }
}

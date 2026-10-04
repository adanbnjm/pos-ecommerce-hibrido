import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Roles } from './decorators/roles/roles.decorator.js';
import { RolesGuard } from './guards/roles/roles.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  @Get('perfil')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  perfil(@Req() solicitud: Request) {
    return {
      mensaje: 'Acceso autorizado',
      usuario: solicitud.user,
    };
  }
}

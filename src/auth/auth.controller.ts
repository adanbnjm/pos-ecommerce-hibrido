import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario mediante correo y contraseña y devuelve un token JWT.',
  })
  @ApiBody({
    description: 'Credenciales del usuario',
    schema: {
      example: {
        email: 'cliente@pos.local',
        password: '12345678',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Inicio de sesión correcto. Devuelve el token JWT y los datos del usuario.',
    schema: {
      example: {
        mensaje: 'Inicio de sesión correcto',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usuario: {
          id: 5,
          nombre: 'Cliente Demo',
          email: 'cliente@pos.local',
          rol: 'CLIENTE',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Correo o contraseña incorrectos.',
  })
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  @Get('perfil')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Devuelve la información del usuario obtenida desde el token JWT.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido correctamente.',
    schema: {
      example: {
        mensaje: 'Acceso autorizado',
        usuario: {
          id: 5,
          email: 'cliente@pos.local',
          rol: 'CLIENTE',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, ausente o expirado.',
  })
  @UseGuards(JwtAuthGuard)
  perfil(@Req() solicitud: Request) {
    return {
      mensaje: 'Acceso autorizado',
      usuario: solicitud.user,
    };
  }
}

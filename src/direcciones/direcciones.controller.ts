import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CrearDireccionDto } from './dto/crear-direccion.dto.js';
import { DireccionesService } from './direcciones.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Direcciones')
@ApiBearerAuth('JWT-auth')
@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @Post()
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  crear(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: CrearDireccionDto,
  ) {
    return this.direccionesService.crear(solicitud.user.id, datos);
  }
}

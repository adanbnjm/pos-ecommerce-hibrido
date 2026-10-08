import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Crear dirección',
    description: 'Crea una dirección para el cliente autenticado.',
  })
  @ApiBody({
    description: 'Datos de la dirección',
    schema: {
      example: {
        departamento: 'Santa Cruz',
        ciudad: 'Santa Cruz de la Sierra',
        zona: 'Equipetrol',
        calle: 'Av. San Martín',
        numero: '123',
        referencia: 'Cerca de la plaza',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Dirección creada correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los clientes pueden crear direcciones.',
  })
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

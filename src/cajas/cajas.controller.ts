import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { CajasService } from './cajas.service.js';
import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Cajas')
@ApiBearerAuth('JWT-auth')
@Controller('cajas')
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post('abrir')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Abrir caja',
    description:
      'Abre una nueva caja para el usuario autenticado. Disponible para ADMIN y CAJERO.',
  })
  @ApiBody({
    description: 'Datos necesarios para abrir la caja.',
    schema: {
      example: {
        montoApertura: 500,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Caja abierta correctamente.',
    schema: {
      example: {
        mensaje: 'Caja abierta correctamente',
        caja: {
          id: 1,
          usuarioId: 1,
          montoApertura: '500.00',
          fechaApertura: '2026-10-08T17:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede abrir la caja porque el usuario ya tiene una caja abierta.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden abrir cajas.',
  })
  abrir(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: AbrirCajaDto,
  ) {
    return this.cajasService.abrir(solicitud.user.id, datos);
  }

  @Post(':id/cerrar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Cerrar caja',
    description: 'Cierra la caja perteneciente al usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la caja que se desea cerrar.',
    example: 1,
  })
  @ApiBody({
    description: 'Datos necesarios para cerrar la caja.',
    schema: {
      example: {
        montoCierre: 1250,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Caja cerrada correctamente.',
    schema: {
      example: {
        mensaje: 'Caja cerrada correctamente',
        caja: {
          id: 1,
          usuarioId: 1,
          montoApertura: '500.00',
          montoCierre: '1250.00',
          fechaApertura: '2026-10-08T17:00:00.000Z',
          fechaCierre: '2026-10-08T23:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La caja ya está cerrada o los datos enviados no son válidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden cerrar cajas.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caja no encontrada o no pertenece al usuario autenticado.',
  })
  cerrar(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CerrarCajaDto,
  ) {
    return this.cajasService.cerrar(solicitud.user.id, id, datos);
  }
}

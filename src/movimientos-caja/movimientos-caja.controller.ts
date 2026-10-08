import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
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

import { CrearMovimientoCajaDto } from './dto/crear-movimiento-caja.dto.js';
import { ResolverMovimientoCajaDto } from './dto/resolver-movimiento-caja.dto.js';
import { MovimientosCajaService } from './movimientos-caja.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('MovimientosCaja')
@ApiBearerAuth('JWT-auth')
@Controller('movimientos-caja')
export class MovimientosCajaController {
  constructor(
    private readonly movimientosCajaService: MovimientosCajaService,
  ) {}

  @Post('caja/:cajaId/solicitar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Solicitar movimiento de caja',
    description:
      'Crea una solicitud de entrada o salida de dinero para una caja. Disponible para ADMIN y CAJERO.',
  })
  @ApiParam({
    name: 'cajaId',
    description: 'ID de la caja donde se realizará el movimiento.',
    example: 1,
  })
  @ApiBody({
    description: 'Datos del movimiento de caja.',
    schema: {
      example: {
        tipo: 'SALIDA',
        monto: 100,
        motivo: 'Compra de material para el negocio',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento de caja creado correctamente.',
    schema: {
      example: {
        mensaje: 'Movimiento de caja creado correctamente',
        movimiento: {
          id: 1,
          cajaId: 1,
          solicitadoPor: 1,
          tipo: 'SALIDA',
          monto: '100.00',
          motivo: 'Compra de material para el negocio',
          estado: 'PENDIENTE',
          creadoEn: '2026-10-08T18:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, monto no válido o caja cerrada.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden solicitar movimientos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caja no encontrada.',
  })
  crear(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: CrearMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.crear(cajaId, solicitud.user.id, datos);
  }

  @Patch(':id/resolver')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Resolver movimiento de caja',
    description:
      'Aprueba o rechaza una solicitud de movimiento de caja. Disponible únicamente para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del movimiento de caja.',
    example: 1,
  })
  @ApiBody({
    description: 'Indica si el movimiento debe ser aprobado o rechazado.',
    schema: {
      example: {
        estado: 'APROBADO',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Movimiento de caja resuelto correctamente.',
    schema: {
      example: {
        mensaje: 'Movimiento de caja aprobado correctamente',
        movimiento: {
          id: 1,
          cajaId: 1,
          solicitadoPor: 1,
          autorizadoPor: 3,
          tipo: 'SALIDA',
          monto: '100.00',
          motivo: 'Compra de material para el negocio',
          estado: 'APROBADO',
          creadoEn: '2026-10-08T18:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El movimiento ya fue resuelto o los datos enviados no son válidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede resolver movimientos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento de caja no encontrado.',
  })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: ResolverMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.resolver(id, solicitud.user.id, datos);
  }
}

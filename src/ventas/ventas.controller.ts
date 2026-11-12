import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CrearVentaDto } from './dto/crear-venta.dto.js';
import { VentasService } from './ventas.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Ventas')
@ApiBearerAuth('JWT-auth')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // Consultar historial de ventas
  @Get('historial')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Consultar historial de ventas',
    description:
      'Obtiene las ventas del usuario autenticado para una fecha específica.',
  })
  @ApiQuery({
    name: 'fecha',
    required: true,
    example: '2026-11-12',
    description: 'Fecha de consulta en formato YYYY-MM-DD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de ventas obtenido correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Fecha inválida.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden consultar el historial.',
  })
  historial(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Query('fecha') fecha: string,
  ) {
    return this.ventasService.obtenerHistorial(fecha, solicitud.user.id);
  }

  // Registrar una venta
  @Post()
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Registrar venta',
    description:
      'Registra una nueva venta en el sistema POS. Disponible para ADMIN y CAJERO.',
  })
  @ApiBody({
    description: 'Datos de la venta y sus productos.',
    schema: {
      example: {
        cajaId: 1,
        metodoPago: 'EFECTIVO',
        detalles: [
          {
            productoId: 2,
            cantidad: 1,
          },
          {
            productoId: 5,
            cantidad: 2,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Venta registrada correctamente.',
    schema: {
      example: {
        id: 1,
        cajaId: 1,
        total: '320.50',
        metodoPago: 'EFECTIVO',
        creadoEn: '2026-10-08T19:00:00.000Z',
        detalles: [
          {
            id: 1,
            ventaId: 1,
            productoId: 2,
            cantidad: 1,
            precioUnitario: '80.50',
          },
          {
            id: 2,
            ventaId: 1,
            productoId: 5,
            cantidad: 2,
            precioUnitario: '120.00',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, caja cerrada, stock insuficiente o productos inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden registrar ventas.',
  })
  @ApiResponse({
    status: 404,
    description: 'Caja o producto no encontrado.',
  })
  crear(@Body() datos: CrearVentaDto) {
    return this.ventasService.crear(datos);
  }
}

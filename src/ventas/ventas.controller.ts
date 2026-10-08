import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
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

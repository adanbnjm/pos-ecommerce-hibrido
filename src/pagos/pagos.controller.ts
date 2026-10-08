import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MockPayWebhookDto } from './dto/mockpay-webhook.dto.js';

import type { Request } from 'express';

import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagosService } from './pagos.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}
  @Get('pedido/:pedidoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  obtenerPagosPorPedido(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ) {
    return this.pagosService.obtenerPagosPorPedido(
      solicitud.user.id,
      solicitud.user.rol,
      pedidoId,
    );
  }

  @Get(':pagoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  obtenerPago(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('pagoId', ParseIntPipe) pagoId: number,
  ) {
    return this.pagosService.obtenerPago(
      solicitud.user.id,
      solicitud.user.rol,
      pagoId,
    );
  }

  @Post('pedido/:pedidoId')
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
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Body() datos: CrearPagoDto,
  ) {
    return this.pagosService.crear(solicitud.user.id, pedidoId, datos);
  }

  @Post(':pagoId/aprobar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  aprobar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.aprobar(pagoId);
  }

  @Post(':pagoId/rechazar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  rechazar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.rechazar(pagoId);
  }
  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() datos: MockPayWebhookDto) {
    return this.pagosService.procesarWebhook(datos);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CrearPedidoDto } from './dto/crear-pedido.dto.js';
import { PedidosService } from './pedidos.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Pedidos')
@ApiBearerAuth('JWT-auth')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  obtenerPedidos(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
  ) {
    return this.pedidosService.obtenerPedidos(
      solicitud.user.id,
      solicitud.user.rol,
    );
  }

  @Get(':pedidoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  obtenerPedido(
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
    return this.pedidosService.obtenerPedido(
      solicitud.user.id,
      solicitud.user.rol,
      pedidoId,
    );
  }

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
    @Body() datos: CrearPedidoDto,
  ) {
    return this.pedidosService.crear(solicitud.user.id, datos);
  }

  @Post('reservas/:reservaId/expirar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  expirarReserva(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('reservaId', ParseIntPipe) reservaId: number,
  ) {
    return this.pedidosService.expirarReserva(solicitud.user.id, reservaId);
  }

  @Post(':pedidoId/cancelar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cancelarPedido(
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
    return this.pedidosService.cancelarPedido(solicitud.user.id, pedidoId);
  }

  @Post(':pedidoId/enviar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  enviarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.enviarPedido(pedidoId);
  }

  @Post(':pedidoId/entregar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  entregarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.entregarPedido(pedidoId);
  }
}

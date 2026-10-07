import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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

  @Post()
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  crear(@Body() datos: CrearPedidoDto) {
    return this.pedidosService.crear(datos);
  }

  @Post('reservas/:reservaId/expirar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  expirarReserva(@Param('reservaId', ParseIntPipe) reservaId: number) {
    return this.pedidosService.expirarReserva(reservaId);
  }

  @Post(':pedidoId/cancelar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cancelarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.cancelarPedido(pedidoId);
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

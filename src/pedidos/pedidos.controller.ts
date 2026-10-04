import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CrearPedidoDto } from './dto/crear-pedido.dto.js';
import { PedidosService } from './pedidos.service.js';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  crear(@Body() datos: CrearPedidoDto) {
    return this.pedidosService.crear(datos);
  }
  @Post('reservas/:reservaId/expirar')
  expirarReserva(@Param('reservaId', ParseIntPipe) reservaId: number) {
    return this.pedidosService.expirarReserva(reservaId);
  }
  @Post(':pedidoId/cancelar')
  cancelarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.cancelarPedido(pedidoId);
  }
  @Post(':pedidoId/enviar')
  enviarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.enviarPedido(pedidoId);
  }
  @Post(':pedidoId/entregar')
  entregarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.entregarPedido(pedidoId);
  }
}

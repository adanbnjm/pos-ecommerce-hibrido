import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';

import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagosService } from './pagos.service.js';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('pedido/:pedidoId')
  crear(
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Body() datos: CrearPagoDto,
  ) {
    return this.pagosService.crear(pedidoId, datos);
  }

  @Post(':pagoId/aprobar')
  aprobar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.aprobar(pagoId);
  }

  @Post(':pagoId/rechazar')
  rechazar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.rechazar(pagoId);
  }
}

import { Module } from '@nestjs/common';

import { MovimientosCajaController } from './movimientos-caja.controller.js';
import { MovimientosCajaService } from './movimientos-caja.service.js';

@Module({
  controllers: [MovimientosCajaController],
  providers: [MovimientosCajaService],
})
export class MovimientosCajaModule {}

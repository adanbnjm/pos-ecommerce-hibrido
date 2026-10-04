import { Module } from '@nestjs/common';

import { CajasController } from './cajas.controller.js';
import { CajasService } from './cajas.service.js';

@Module({
  controllers: [CajasController],
  providers: [CajasService],
})
export class CajasModule {}

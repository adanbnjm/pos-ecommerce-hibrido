import { Module } from '@nestjs/common';

import { PagosController } from './pagos.controller.js';
import { PagosService } from './pagos.service.js';

import { MockPayModule } from '../mockpay/mockpay.module.js';

@Module({
  imports: [MockPayModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}

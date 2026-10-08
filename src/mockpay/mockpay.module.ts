import { Module } from '@nestjs/common';
import { MockPayService } from './mockpay.service.js';

@Module({
  providers: [MockPayService],
  exports: [MockPayService],
})
export class MockPayModule {}

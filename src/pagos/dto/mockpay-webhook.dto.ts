import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class MockPayWebhookDto {
  @IsString()
  @IsIn(['payment.succeeded', 'payment.failed'])
  event: 'payment.succeeded' | 'payment.failed';

  @IsString()
  id: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  @IsIn(['SUCCEEDED', 'FAILED'])
  status: 'SUCCEEDED' | 'FAILED';

  @IsOptional()
  @IsString()
  failure_reason: string | null;

  @IsObject()
  metadata: {
    order_id: string;
  };

  @IsString()
  created_at: string;
}

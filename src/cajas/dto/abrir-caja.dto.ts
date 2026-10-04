import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AbrirCajaDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoApertura: number;
}

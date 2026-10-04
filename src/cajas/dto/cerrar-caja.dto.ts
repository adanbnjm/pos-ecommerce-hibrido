import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CerrarCajaDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoCierre: number;
}

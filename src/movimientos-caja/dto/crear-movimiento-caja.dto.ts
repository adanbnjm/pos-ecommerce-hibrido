import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { TipoMovimientoCaja } from '../../../generated/prisma/enums.js';

export class CrearMovimientoCajaDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  monto: number;

  @IsEnum(TipoMovimientoCaja)
  tipo: TipoMovimientoCaja;

  @IsString()
  motivo: string;
}

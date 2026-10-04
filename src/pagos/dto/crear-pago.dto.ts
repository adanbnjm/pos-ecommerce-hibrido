import { IsEnum } from 'class-validator';

import { MonedaPago } from '../../../generated/prisma/enums.js';

export class CrearPagoDto {
  @IsEnum(MonedaPago)
  moneda: MonedaPago;
}

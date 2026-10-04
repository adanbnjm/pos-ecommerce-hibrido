import { IsEnum } from 'class-validator';

import { EstadoMovimientoCaja } from '../../../generated/prisma/enums.js';

export class ResolverMovimientoCajaDto {
  @IsEnum(EstadoMovimientoCaja)
  estado: EstadoMovimientoCaja;
}

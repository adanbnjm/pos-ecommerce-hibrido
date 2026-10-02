import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../../../generated/prisma/enums.js';

class CrearDetalleVentaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CrearVentaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cajaId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleVentaDto)
  detalles: CrearDetalleVentaDto[];

  @IsEnum(MetodoPago)
  @IsNotEmpty()
  metodoPago: MetodoPago;
}

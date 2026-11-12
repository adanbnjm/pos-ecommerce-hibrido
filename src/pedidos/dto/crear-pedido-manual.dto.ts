import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CrearDetallePedidoManualDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CrearPedidoManualDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destinatario: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  celularDestinatario: string;

  @IsString()
  @IsNotEmpty()
  departamento: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  zona: string;

  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencia?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearDetallePedidoManualDto)
  detalles: CrearDetallePedidoManualDto[];

  @IsIn(['FACEBOOK', 'WHATSAPP', 'OTRO'])
  @IsNotEmpty()
  origen: 'FACEBOOK' | 'WHATSAPP' | 'OTRO';
}

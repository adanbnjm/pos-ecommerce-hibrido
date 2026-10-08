import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Min,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

import { OrigenPedido } from '../../../generated/prisma/enums.js';

class CrearDetallePedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;
}

function ProductosUnicos(validationOptions?: ValidationOptions) {
  return function (objeto: object, propiedad: string) {
    registerDecorator({
      name: 'productosUnicos',
      target: objeto.constructor,
      propertyName: propiedad,
      options: validationOptions,
      validator: {
        validate(detalles: CrearDetallePedidoDto[]) {
          const ids = detalles.map((detalle) => detalle.productoId);

          return new Set(ids).size === ids.length;
        },

        defaultMessage() {
          return 'No se puede repetir un producto dentro del pedido';
        },
      },
    });
  };
}

export class CrearPedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  direccionId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearDetallePedidoDto)
  @ProductosUnicos()
  detalles: CrearDetallePedidoDto[];

  @IsEnum(OrigenPedido)
  @IsNotEmpty()
  origen: OrigenPedido;
}

import { PartialType } from '@nestjs/mapped-types';
import { CrearProductoDto } from './crear-producto.dto.js';

export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}

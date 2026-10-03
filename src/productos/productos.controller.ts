import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProductosService } from './productos.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @ApiQuery({
    name: 'soloActivos',
    required: false,
    type: Boolean,
    description:
      'Filtra por estado: true = activos, false = inactivos. Si se omite, devuelve todos.',
  })
  @Get()
  obtenerTodos(@Query('soloActivos') soloActivos?: string) {
    if (soloActivos === undefined) {
      return this.productosService.obtenerTodos();
    }

    return this.productosService.obtenerTodos(soloActivos === 'true');
  }
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.obtenerPorId(id);
  }

  @Post()
  crear(@Body() datos: CrearProductoDto) {
    return this.productosService.crear(datos);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarProductoDto,
  ) {
    return this.productosService.actualizar(id, datos);
  }
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.eliminar(id);
  }
}

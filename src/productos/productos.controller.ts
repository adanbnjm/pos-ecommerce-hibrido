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
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProductosService } from './productos.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Productos')
@ApiBearerAuth('JWT-auth')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener productos',
    description:
      'Obtiene el listado de productos. Permite filtrar por productos activos o inactivos.',
  })
  @ApiQuery({
    name: 'soloActivos',
    required: false,
    type: Boolean,
    description:
      'Filtra por estado: true = activos, false = inactivos. Si se omite, devuelve todos.',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Productos obtenidos correctamente.',
    schema: {
      example: [
        {
          id: 2,
          codigo: 'LUB-001',
          nombre: 'Aceite sintético 10W-40',
          descripcion: 'Aceite para motor de motocicleta',
          precioActual: '80.50',
          costoAdquisicion: '50.00',
          stock: 10,
          activo: true,
          categoriaId: 1,
          creadoEn: '2026-10-08T17:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden consultar productos.',
  })
  obtenerTodos(@Query('soloActivos') soloActivos?: string) {
    if (soloActivos === undefined) {
      return this.productosService.obtenerTodos();
    }

    return this.productosService.obtenerTodos(soloActivos === 'true');
  }

  @Get(':id')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Obtiene un producto específico mediante su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto obtenido correctamente.',
    schema: {
      example: {
        id: 2,
        codigo: 'LUB-001',
        nombre: 'Aceite sintético 10W-40',
        descripcion: 'Aceite para motor de motocicleta',
        precioActual: '80.50',
        costoAdquisicion: '50.00',
        stock: 10,
        activo: true,
        categoriaId: 1,
        creadoEn: '2026-10-08T17:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden consultar productos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
  })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.obtenerPorId(id);
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Crear producto',
    description:
      'Crea un nuevo producto en el catálogo. Disponible únicamente para ADMIN.',
  })
  @ApiBody({
    description: 'Datos del nuevo producto',
    schema: {
      example: {
        codigo: 'ACC-003',
        nombre: 'Casco para motocicleta',
        descripcion: 'Casco integral de seguridad',
        precioActual: 350,
        costoAdquisicion: 220,
        stock: 15,
        categoriaId: 2,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o categoría inexistente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede crear productos.',
  })
  crear(@Body() datos: CrearProductoDto) {
    return this.productosService.crear(datos);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Actualizar producto',
    description:
      'Actualiza los datos de un producto existente. Disponible únicamente para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 2,
  })
  @ApiBody({
    description: 'Datos que se desean actualizar',
    schema: {
      example: {
        precioActual: 85,
        stock: 20,
        activo: true,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede actualizar productos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
  })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarProductoDto,
  ) {
    return this.productosService.actualizar(id, datos);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Eliminar producto',
    description:
      'Elimina un producto del catálogo. Disponible únicamente para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede eliminar productos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar el producto porque tiene registros relacionados.',
  })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.eliminar(id);
  }
}

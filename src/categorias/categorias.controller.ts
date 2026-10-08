import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CategoriasService } from './categorias.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Categorías')
@ApiBearerAuth('JWT-auth')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener categorías',
    description: 'Obtiene todas las categorías registradas en el catálogo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categorías obtenidas correctamente.',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Lubricantes',
          descripcion:
            'Aceites y productos para mantenimiento de motocicletas.',
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
    description: 'Solo ADMIN y CAJERO pueden consultar categorías.',
  })
  obtenerTodas() {
    return this.categoriasService.obtenerTodas();
  }

  @Get(':id')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Obtiene una categoría específica mediante su ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría obtenida correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden consultar categorías.',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada.',
  })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.obtenerPorId(id);
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Crear categoría',
    description:
      'Crea una nueva categoría para organizar los productos. Disponible únicamente para ADMIN.',
  })
  @ApiBody({
    description: 'Datos de la nueva categoría',
    schema: {
      example: {
        nombre: 'Accesorios',
        descripcion: 'Accesorios y equipamiento para motociclistas.',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre de categoría duplicado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede crear categorías.',
  })
  crear(@Body() datos: CrearCategoriaDto) {
    return this.categoriasService.crear(datos);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Actualizar categoría',
    description:
      'Actualiza los datos de una categoría existente. Disponible únicamente para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: 1,
  })
  @ApiBody({
    description: 'Datos que se desean actualizar',
    schema: {
      example: {
        nombre: 'Lubricantes y aceites',
        descripcion: 'Productos para lubricación y mantenimiento.',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada correctamente.',
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
    description: 'Solo ADMIN puede actualizar categorías.',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada.',
  })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriasService.actualizar(id, datos);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Eliminar categoría',
    description:
      'Elimina una categoría del catálogo. Disponible únicamente para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría eliminada correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN puede eliminar categorías.',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada.',
  })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar la categoría porque tiene productos relacionados.',
  })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(id);
  }
}

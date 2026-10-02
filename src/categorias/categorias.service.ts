import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTodas() {
    return this.prisma.categoria.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: {
        id,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }

  async crear(datos: CrearCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
      },
    });
  }
  async actualizar(id: number, datos: ActualizarCategoriaDto) {
    const categoria = await this.prisma.categoria.findUnique({
      where: {
        id,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.categoria.update({
      where: {
        id,
      },
      data: datos,
    });
  }
  async eliminar(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const producto = await this.prisma.producto.findFirst({
      where: {
        categoriaId: id,
      },
    });

    if (producto) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene productos asociados',
      );
    }

    return this.prisma.categoria.delete({
      where: { id },
    });
  }
}

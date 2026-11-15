import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}
  private async calcularStockReservado(
    productos: { id: number; stock: number }[],
  ) {
    const stockReservado = new Map<number, number>();

    if (productos.length === 0) {
      return stockReservado;
    }

    const ids = productos.map((producto) => producto.id);

    const reservas = await this.prisma.reserva.findMany({
      where: {
        estado: 'ACTIVA',
        expiraEn: {
          gt: new Date(),
        },
        pedido: {
          detalles: {
            some: {
              productoId: {
                in: ids,
              },
            },
          },
        },
      },
      include: {
        pedido: {
          include: {
            detalles: true,
          },
        },
      },
    });

    for (const reserva of reservas) {
      for (const detalle of reserva.pedido.detalles) {
        if (!ids.includes(detalle.productoId)) continue;

        const cantidadActual = stockReservado.get(detalle.productoId) ?? 0;

        stockReservado.set(
          detalle.productoId,
          cantidadActual + detalle.cantidad,
        );
      }
    }

    return stockReservado;
  }

  async obtenerTodos(soloActivos?: boolean) {
    const productos = await this.prisma.producto.findMany({
      where:
        soloActivos === undefined
          ? undefined
          : {
              activo: soloActivos,
            },
      orderBy: {
        nombre: 'asc',
      },
    });

    const reservas = await this.calcularStockReservado(productos);

    return productos.map((producto) => {
      const stockReservado = reservas.get(producto.id) ?? 0;

      return {
        ...producto,
        stockReservado,
        stockDisponible: Math.max(0, producto.stock - stockReservado),
      };
    });
  }
  async obtenerCatalogoPublico() {
    const productos = await this.prisma.producto.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precioActual: true,
        stock: true,
        categoriaId: true,
      },
    });

    const reservas = await this.calcularStockReservado(productos);

    return productos.map((producto) => {
      const stockReservado = reservas.get(producto.id) ?? 0;

      return {
        ...producto,
        stock: Math.max(0, producto.stock - stockReservado),
      };
    });
  }
  async obtenerPorId(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: {
        id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }
  async crear(datos: CrearProductoDto) {
    const categoria = await this.prisma.categoria.findUnique({
      where: {
        id: datos.categoriaId,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }
    const productoExistente = await this.prisma.producto.findUnique({
      where: {
        codigo: datos.codigo,
      },
    });

    if (productoExistente) {
      throw new ConflictException('Ya existe un producto con ese código');
    }

    return this.prisma.producto.create({
      data: {
        codigo: datos.codigo,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precioActual: datos.precioActual,
        costoAdquisicion: datos.costoAdquisicion,
        stock: datos.stock,
        activo: datos.activo ?? true,
        categoriaId: datos.categoriaId,
      },
    });
  }
  async actualizar(id: number, datos: ActualizarProductoDto) {
    const producto = await this.prisma.producto.findUnique({
      where: {
        id,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (datos.categoriaId !== undefined) {
      const categoria = await this.prisma.categoria.findUnique({
        where: {
          id: datos.categoriaId,
        },
      });

      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    if (datos.codigo !== undefined) {
      const productoExistente = await this.prisma.producto.findUnique({
        where: {
          codigo: datos.codigo,
        },
      });

      if (productoExistente && productoExistente.id !== id) {
        throw new ConflictException('Ya existe otro producto con ese código');
      }
    }

    return this.prisma.producto.update({
      where: {
        id,
      },
      data: datos,
    });
  }
  // Desactivar un producto
  async eliminar(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.producto.update({
      where: { id },
      data: {
        activo: false,
      },
    });
  }
}

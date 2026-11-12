import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CrearVentaDto } from './dto/crear-venta.dto.js';

@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerHistorial(fecha: string, usuarioId: number) {
    // Comprobar que la fecha tenga el formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException(
        'La fecha debe tener el formato YYYY-MM-DD',
      );
    }

    const [año, mes, dia] = fecha.split('-').map(Number);

    // Comprobar que sea una fecha real
    const fechaValidada = new Date(Date.UTC(año, mes - 1, dia));

    if (
      fechaValidada.getUTCFullYear() !== año ||
      fechaValidada.getUTCMonth() !== mes - 1 ||
      fechaValidada.getUTCDate() !== dia
    ) {
      throw new BadRequestException('La fecha ingresada no es válida');
    }

    // El negocio utiliza el horario de Bolivia (UTC-4)
    const inicio = new Date(`${fecha}T00:00:00.000-04:00`);
    const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.venta.findMany({
      where: {
        creadoEn: {
          gte: inicio,
          lt: fin,
        },
        caja: {
          usuarioId,
        },
      },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async crear(datos: CrearVentaDto) {
    // 1. Buscar la caja
    const caja = await this.prisma.caja.findUnique({
      where: {
        id: datos.cajaId,
      },
    });

    // 2. Comprobar que exista
    if (!caja) {
      throw new NotFoundException('Caja no encontrada');
    }

    // 3. Comprobar que esté abierta
    if (caja.fechaCierre !== null) {
      throw new BadRequestException('La caja está cerrada');
    }

    // 4. Buscar los productos de la venta
    const productos = await this.prisma.producto.findMany({
      where: {
        id: {
          in: datos.detalles.map((detalle) => detalle.productoId),
        },
      },
    });

    // 5. Comprobar que existan todos los productos
    if (productos.length !== datos.detalles.length) {
      throw new NotFoundException('Uno o más productos no fueron encontrados');
    }

    // 6. Comprobar que ningún producto esté inactivo
    const productoInactivo = productos.find((producto) => !producto.activo);

    if (productoInactivo) {
      throw new BadRequestException(
        `El producto "${productoInactivo.nombre}" está inactivo`,
      );
    }

    // 7. Buscar reservas activas que todavía no hayan expirado
    const reservasActivas = await this.prisma.reserva.findMany({
      where: {
        estado: 'ACTIVA',
        pedido: {
          detalles: {
            some: {
              productoId: {
                in: datos.detalles.map((detalle) => detalle.productoId),
              },
            },
          },
        },
        expiraEn: {
          gt: new Date(),
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

    // 8. Calcular cuánto stock está reservado por producto
    const stockReservado = new Map<number, number>();

    for (const reserva of reservasActivas) {
      for (const detalle of reserva.pedido.detalles) {
        const cantidadActual = stockReservado.get(detalle.productoId) ?? 0;

        stockReservado.set(
          detalle.productoId,
          cantidadActual + detalle.cantidad,
        );
      }
    }

    // 9. Calcular el total y comprobar el stock disponible
    let total = 0;

    for (const detalle of datos.detalles) {
      const producto = productos.find(
        (producto) => producto.id === detalle.productoId,
      );

      if (!producto) {
        throw new NotFoundException(
          `Producto ${detalle.productoId} no encontrado`,
        );
      }

      const reservado = stockReservado.get(producto.id) ?? 0;

      const disponible = producto.stock - reservado;

      if (detalle.cantidad > disponible) {
        throw new BadRequestException(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${disponible}`,
        );
      }

      total += Number(producto.precioActual) * detalle.cantidad;
    }

    // 10. Registrar la venta, sus detalles y descontar stock
    const resultado = await this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          cajaId: caja.id,
          total,
          metodoPago: datos.metodoPago,
        },
      });

      for (const detalle of datos.detalles) {
        const producto = productos.find(
          (producto) => producto.id === detalle.productoId,
        );

        if (!producto) {
          throw new NotFoundException(
            `Producto ${detalle.productoId} no encontrado`,
          );
        }

        await tx.detalleVenta.create({
          data: {
            ventaId: venta.id,
            productoId: producto.id,
            cantidad: detalle.cantidad,
            precioUnitario: producto.precioActual,
          },
        });

        const stockActualizado = await tx.producto.updateMany({
          where: {
            id: producto.id,
            stock: {
              gte: detalle.cantidad,
            },
          },
          data: {
            stock: {
              decrement: detalle.cantidad,
            },
          },
        });

        if (stockActualizado.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para "${producto.nombre}"`,
          );
        }
      }

      return {
        mensaje: 'Venta creada correctamente',
        venta,
      };
    });

    return resultado;
  }
}

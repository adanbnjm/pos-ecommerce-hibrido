import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CrearPedidoDto } from './dto/crear-pedido.dto.js';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: number, datos: CrearPedidoDto) {
    // 1. Verificar que el usuario exista
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Buscar la dirección y comprobar que pertenece al usuario
    const direccion = await this.prisma.direccion.findFirst({
      where: {
        id: datos.direccionId,
        usuarioId: usuarioId,
      },
    });

    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada para este usuario');
    }

    // 3. Buscar todos los productos
    const productos = await this.prisma.producto.findMany({
      where: {
        id: {
          in: datos.detalles.map((detalle) => detalle.productoId),
        },
      },
    });

    // 4. Comprobar que todos los productos existan
    if (productos.length !== datos.detalles.length) {
      throw new NotFoundException('Uno o más productos no fueron encontrados');
    }

    // 5. Comprobar que todos estén activos
    const productoInactivo = productos.find((producto) => !producto.activo);

    if (productoInactivo) {
      throw new BadRequestException(
        `El producto "${productoInactivo.nombre}" está inactivo`,
      );
    }

    // 6. Buscar reservas activas que todavía no hayan expirado
    const reservasActivas = await this.prisma.reserva.findMany({
      where: {
        estado: 'ACTIVA',
        expiraEn: {
          gt: new Date(),
        },
        pedido: {
          detalles: {
            some: {
              productoId: {
                in: datos.detalles.map((detalle) => detalle.productoId),
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

    // 7. Calcular cuánto stock está reservado
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

    // 8. Verificar stock y calcular total
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

    // 9. Crear pedido, detalles y reserva juntos
    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          usuarioId: usuario.id,
          direccionId: direccion.id,

          destinatario: usuario.nombre,
          celularDestinatario: usuario.celular,

          departamento: direccion.departamento,
          ciudad: direccion.ciudad,
          zona: direccion.zona,
          calle: direccion.calle,
          numero: direccion.numero,
          referencia: direccion.referencia,

          total,
          estado: 'PENDIENTE',
          origen: datos.origen,
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

        await tx.detallePedido.create({
          data: {
            pedidoId: pedido.id,
            productoId: producto.id,
            cantidad: detalle.cantidad,
            precioUnitario: producto.precioActual,
          },
        });
      }

      const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

      await tx.reserva.create({
        data: {
          pedidoId: pedido.id,
          expiraEn,
          estado: 'ACTIVA',
        },
      });

      return pedido;
    });

    return {
      mensaje: 'Pedido creado correctamente',
      pedido: resultado,
    };
  }
  async expirarReserva(usuarioId: number, reservaId: number) {
    const reserva = await this.prisma.reserva.findFirst({
      where: {
        id: reservaId,
        pedido: {
          usuarioId,
        },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado !== 'ACTIVA') {
      throw new BadRequestException('La reserva ya no está activa');
    }

    if (reserva.expiraEn > new Date()) {
      throw new BadRequestException('La reserva todavía no ha expirado');
    }

    const reservaActualizada = await this.prisma.reserva.update({
      where: {
        id: reservaId,
      },
      data: {
        estado: 'EXPIRADA',
      },
    });

    return {
      mensaje: 'Reserva expirada correctamente',
      reserva: reservaActualizada,
    };
  }
  async obtenerPedidos(usuarioId: number, rol: string) {
    const pedidos = await this.prisma.pedido.findMany({
      where:
        rol === 'CLIENTE'
          ? {
              usuarioId,
            }
          : undefined,
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        reservas: true,
        pagos: true,
        direccion: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    return pedidos;
  }

  async obtenerPedido(usuarioId: number, rol: string, pedidoId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        ...(rol === 'CLIENTE' ? { usuarioId } : {}),
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
        reservas: true,
        pagos: true,
        direccion: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return pedido;
  }
  async cancelarPedido(usuarioId: number, pedidoId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId,
      },
      include: { reservas: true },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== 'PENDIENTE') {
      throw new BadRequestException(
        'Solo se pueden cancelar pedidos pendientes',
      );
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedidoActualizado = await tx.pedido.update({
        where: {
          id: pedidoId,
        },
        data: {
          estado: 'CANCELADO',
        },
      });

      await tx.reserva.updateMany({
        where: {
          pedidoId,
          estado: 'ACTIVA',
        },
        data: {
          estado: 'CANCELADA',
        },
      });

      return pedidoActualizado;
    });

    return {
      mensaje: 'Pedido cancelado correctamente',
      pedido: resultado,
    };
  }
  async enviarPedido(pedidoId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: {
        id: pedidoId,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== 'PAGADO') {
      throw new BadRequestException('Solo se pueden enviar pedidos pagados');
    }

    const pedidoActualizado = await this.prisma.pedido.update({
      where: {
        id: pedidoId,
      },
      data: {
        estado: 'EN_TRANSITO',
      },
    });

    return {
      mensaje: 'Pedido enviado correctamente',
      pedido: pedidoActualizado,
    };
  }
  async entregarPedido(pedidoId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: {
        id: pedidoId,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== 'EN_TRANSITO') {
      throw new BadRequestException(
        'Solo se pueden entregar pedidos que están en tránsito',
      );
    }

    const pedidoActualizado = await this.prisma.pedido.update({
      where: {
        id: pedidoId,
      },
      data: {
        estado: 'ENTREGADO',
      },
    });

    return {
      mensaje: 'Pedido entregado correctamente',
      pedido: pedidoActualizado,
    };
  }
}

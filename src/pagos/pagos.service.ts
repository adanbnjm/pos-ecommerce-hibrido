import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MockPayService } from '../mockpay/mockpay.service.js';
import { MockPayWebhookDto } from './dto/mockpay-webhook.dto.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockPayService: MockPayService,
  ) {}

  async crear(usuarioId: number, pedidoId: number, datos: CrearPagoDto) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== 'PENDIENTE') {
      throw new BadRequestException('Solo se puede pagar un pedido pendiente');
    }

    const pagoPendiente = await this.prisma.pago.findFirst({
      where: {
        pedidoId,
        estado: 'PENDIENTE',
      },
    });

    if (pagoPendiente) {
      throw new BadRequestException('El pedido ya tiene un pago pendiente');
    }

    const pagoMockPay = await this.mockPayService.crearPago({
      amount: Number(pedido.total),
      currency: datos.moneda,
      orderId: pedido.id,
    });

    const pago = await this.prisma.pago.create({
      data: {
        pedidoId,
        monto: pedido.total,
        moneda: datos.moneda,
        estado: 'PENDIENTE',
        referencia: pagoMockPay.id_transaccion,
      },
    });

    return {
      mensaje: 'Pago creado correctamente',
      pago,
      checkoutUrl: pagoMockPay.checkout_url,
    };
  }
  async obtenerPagosPorPedido(
    usuarioId: number,
    rol: string,
    pedidoId: number,
  ) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        ...(rol === 'CLIENTE' ? { usuarioId } : {}),
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.prisma.pago.findMany({
      where: {
        pedidoId,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async obtenerPago(usuarioId: number, rol: string, pagoId: number) {
    const pago = await this.prisma.pago.findFirst({
      where: {
        id: pagoId,
        ...(rol === 'CLIENTE'
          ? {
              pedido: {
                usuarioId,
              },
            }
          : {}),
      },
      include: {
        pedido: true,
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }
  async procesarWebhook(datos: MockPayWebhookDto) {
    const pedidoId = Number(datos.metadata.order_id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      throw new BadRequestException(
        'El order_id recibido desde MockPay no es válido',
      );
    }

    const pago = await this.prisma.pago.findFirst({
      where: {
        pedidoId,
        referencia: datos.id,
      },
      include: {
        pedido: {
          include: {
            detalles: true,
            reservas: true,
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException(
        'No se encontró el pago asociado a la transacción de MockPay',
      );
    }

    if (pago.estado !== 'PENDIENTE') {
      return {
        mensaje: 'El pago ya fue procesado',
        pago,
      };
    }

    if (datos.event === 'payment.failed') {
      const pagoRechazado = await this.prisma.pago.update({
        where: {
          id: pago.id,
        },
        data: {
          estado: 'RECHAZADO',
        },
      });

      return {
        mensaje: 'Pago rechazado por MockPay',
        pago: pagoRechazado,
      };
    }

    if (datos.event !== 'payment.succeeded') {
      throw new BadRequestException('Evento de MockPay no soportado');
    }

    const reservaActiva = pago.pedido.reservas.find(
      (reserva) => reserva.estado === 'ACTIVA' && reserva.expiraEn > new Date(),
    );

    if (!reservaActiva) {
      throw new BadRequestException('La reserva del pedido ya no está activa');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const pagoActualizado = await tx.pago.update({
        where: {
          id: pago.id,
        },
        data: {
          estado: 'APROBADO',
        },
      });

      await tx.pedido.update({
        where: {
          id: pago.pedidoId,
        },
        data: {
          estado: 'PAGADO',
        },
      });

      await tx.reserva.update({
        where: {
          id: reservaActiva.id,
        },
        data: {
          estado: 'CONFIRMADA',
        },
      });

      for (const detalle of pago.pedido.detalles) {
        const actualizado = await tx.producto.updateMany({
          where: {
            id: detalle.productoId,
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

        if (actualizado.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para el producto ${detalle.productoId}`,
          );
        }
      }

      return pagoActualizado;
    });

    return {
      mensaje: 'Pago confirmado correctamente desde MockPay',
      pago: resultado,
    };
  }

  async aprobar(pagoId: number) {
    const pago = await this.prisma.pago.findUnique({
      where: {
        id: pagoId,
      },
      include: {
        pedido: {
          include: {
            detalles: true,
            reservas: true,
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (pago.estado !== 'PENDIENTE') {
      throw new BadRequestException('El pago ya fue procesado');
    }

    if (pago.pedido.estado !== 'PENDIENTE') {
      throw new BadRequestException('El pedido ya no está pendiente');
    }

    const reservaActiva = pago.pedido.reservas.find(
      (reserva) => reserva.estado === 'ACTIVA' && reserva.expiraEn > new Date(),
    );

    if (!reservaActiva) {
      throw new BadRequestException('La reserva del pedido ya no está activa');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const pagoActualizado = await tx.pago.update({
        where: {
          id: pagoId,
        },
        data: {
          estado: 'APROBADO',
        },
      });

      await tx.pedido.update({
        where: {
          id: pago.pedidoId,
        },
        data: {
          estado: 'PAGADO',
        },
      });

      await tx.reserva.update({
        where: {
          id: reservaActiva.id,
        },
        data: {
          estado: 'CONFIRMADA',
        },
      });

      for (const detalle of pago.pedido.detalles) {
        const actualizado = await tx.producto.updateMany({
          where: {
            id: detalle.productoId,
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

        if (actualizado.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para el producto ${detalle.productoId}`,
          );
        }
      }

      return pagoActualizado;
    });

    return {
      mensaje: 'Pago aprobado correctamente',
      pago: resultado,
    };
  }

  async rechazar(pagoId: number) {
    const pago = await this.prisma.pago.findUnique({
      where: {
        id: pagoId,
      },
      include: {
        pedido: true,
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (pago.estado !== 'PENDIENTE') {
      throw new BadRequestException('El pago ya fue procesado');
    }

    if (pago.pedido.estado !== 'PENDIENTE') {
      throw new BadRequestException('El pedido ya no está pendiente');
    }

    const pagoActualizado = await this.prisma.pago.update({
      where: {
        id: pagoId,
      },
      data: {
        estado: 'RECHAZADO',
      },
    });

    return {
      mensaje: 'Pago rechazado correctamente',
      pago: pagoActualizado,
    };
  }
}

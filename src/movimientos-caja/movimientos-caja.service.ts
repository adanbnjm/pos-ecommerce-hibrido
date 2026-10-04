import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CrearMovimientoCajaDto } from './dto/crear-movimiento-caja.dto.js';
import { ResolverMovimientoCajaDto } from './dto/resolver-movimiento-caja.dto.js';

@Injectable()
export class MovimientosCajaService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    cajaId: number,
    usuarioId: number,
    datos: CrearMovimientoCajaDto,
  ) {
    // 1. Buscar la caja
    const caja = await this.prisma.caja.findUnique({
      where: { id: cajaId },
    });

    if (!caja) {
      throw new NotFoundException('Caja no encontrada');
    }

    // 2. Comprobar que esté abierta
    if (caja.fechaCierre !== null) {
      throw new BadRequestException('La caja está cerrada');
    }

    // 3. Comprobar que exista el usuario solicitante
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    // 4. Registrar el movimiento pendiente
    const movimiento = await this.prisma.movimientoCaja.create({
      data: {
        cajaId,
        solicitadoPor: usuarioId,
        tipo: datos.tipo,
        monto: datos.monto,
        motivo: datos.motivo,
        estado: 'PENDIENTE',
      },
    });

    return {
      mensaje: 'Movimiento de caja solicitado correctamente',
      movimiento,
    };
  }

  async resolver(
    movimientoId: number,
    usuarioId: number,
    datos: ResolverMovimientoCajaDto,
  ) {
    // 1. Buscar el movimiento
    const movimiento = await this.prisma.movimientoCaja.findUnique({
      where: { id: movimientoId },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento de caja no encontrado');
    }

    // 2. Solo se pueden resolver movimientos pendientes
    if (movimiento.estado !== 'PENDIENTE') {
      throw new BadRequestException('El movimiento ya fue resuelto');
    }

    // 3. No permitir dejarlo pendiente otra vez
    if (datos.estado === 'PENDIENTE') {
      throw new BadRequestException('Debes aprobar o rechazar el movimiento');
    }

    // 4. Comprobar que exista el usuario autorizador
    const autorizador = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!autorizador) {
      throw new NotFoundException('Usuario autorizador no encontrado');
    }

    // 5. Resolver el movimiento
    const resultado = await this.prisma.movimientoCaja.updateMany({
      where: {
        id: movimientoId,
        estado: 'PENDIENTE',
      },
      data: {
        estado: datos.estado,
        autorizadoPor: usuarioId,
      },
    });

    if (resultado.count === 0) {
      throw new BadRequestException('El movimiento ya fue resuelto');
    }

    const movimientoActualizado = await this.prisma.movimientoCaja.findUnique({
      where: { id: movimientoId },
    });

    return {
      mensaje:
        datos.estado === 'APROBADO'
          ? 'Movimiento aprobado correctamente'
          : 'Movimiento rechazado correctamente',
      movimiento: movimientoActualizado,
    };
  }
}

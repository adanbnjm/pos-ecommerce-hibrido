import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';

@Injectable()
export class CajasService {
  constructor(private readonly prisma: PrismaService) {}

  async abrir(usuarioId: number, datos: AbrirCajaDto) {
    // 1. Comprobar que el usuario exista
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Comprobar que no tenga otra caja abierta
    const cajaAbierta = await this.prisma.caja.findFirst({
      where: {
        usuarioId,
        fechaCierre: null,
      },
    });

    if (cajaAbierta) {
      throw new BadRequestException('El usuario ya tiene una caja abierta');
    }

    // 3. Crear la caja
    const caja = await this.prisma.caja.create({
      data: {
        usuarioId,
        montoApertura: datos.montoApertura,
      },
    });

    return {
      mensaje: 'Caja abierta correctamente',
      caja,
    };
  }

  async cerrar(usuarioId: number, cajaId: number, datos: CerrarCajaDto) {
    // 1. Buscar la caja
    const caja = await this.prisma.caja.findFirst({
      where: {
        id: cajaId,
        usuarioId,
      },
    });
    if (!caja) {
      throw new NotFoundException('Caja no encontrada');
    }

    // 2. Comprobar que todavía esté abierta
    if (caja.fechaCierre !== null) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // 3. Cerrar la caja
    const cajaCerrada = await this.prisma.caja.update({
      where: {
        id: cajaId,
      },
      data: {
        montoCierre: datos.montoCierre,
        fechaCierre: new Date(),
      },
    });

    return {
      mensaje: 'Caja cerrada correctamente',
      caja: cajaCerrada,
    };
  }
}

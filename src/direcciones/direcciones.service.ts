import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CrearDireccionDto } from './dto/crear-direccion.dto.js';

@Injectable()
export class DireccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: number, datos: CrearDireccionDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const direccion = await this.prisma.direccion.create({
      data: {
        usuarioId,
        departamento: datos.departamento,
        ciudad: datos.ciudad,
        zona: datos.zona,
        calle: datos.calle,
        numero: datos.numero,
        referencia: datos.referencia,
      },
    });

    return {
      mensaje: 'Dirección creada correctamente',
      direccion,
    };
  }
}

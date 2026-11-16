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
  async obtenerAbierta(usuarioId: number) {
    const caja = await this.prisma.caja.findFirst({
      where: {
        usuarioId,
        fechaCierre: null,
      },
    });

    return caja;
  }
  async obtenerTodas(filtros: {
    pagina: number;
    limite: number;
    estado?: string;
    usuarioId?: string;
    desde?: string;
    hasta?: string;
    nombreUsuario?: string;
  }) {
    const { pagina, limite, estado, usuarioId, desde, hasta, nombreUsuario } =
      filtros;

    if (pagina < 1 || limite < 1 || limite > 100) {
      throw new BadRequestException(
        'La página debe ser positiva y el límite debe estar entre 1 y 100.',
      );
    }

    if (estado && !['ABIERTA', 'CERRADA'].includes(estado)) {
      throw new BadRequestException('El estado debe ser ABIERTA o CERRADA.');
    }

    const idUsuario = usuarioId ? Number(usuarioId) : undefined;

    if (usuarioId && (!Number.isInteger(idUsuario) || Number(idUsuario) < 1)) {
      throw new BadRequestException('El ID del usuario no es válido.');
    }

    const fechaDesde = desde ? new Date(`${desde}T00:00:00.000Z`) : undefined;
    const fechaHasta = hasta ? new Date(`${hasta}T23:59:59.999Z`) : undefined;

    if (
      (desde && Number.isNaN(fechaDesde?.getTime())) ||
      (hasta && Number.isNaN(fechaHasta?.getTime()))
    ) {
      throw new BadRequestException('El formato de las fechas no es válido.');
    }

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'La fecha inicial no puede ser posterior a la fecha final.',
      );
    }
    const where = {
      ...(estado === 'ABIERTA' ? { fechaCierre: null } : {}),
      ...(estado === 'CERRADA' ? { fechaCierre: { not: null } } : {}),
      ...(idUsuario ? { usuarioId: idUsuario } : {}),
      ...(fechaDesde || fechaHasta
        ? {
            fechaApertura: {
              ...(fechaDesde ? { gte: fechaDesde } : {}),
              ...(fechaHasta ? { lte: fechaHasta } : {}),
            },
          }
        : {}),
      ...(nombreUsuario?.trim()
        ? {
            usuario: {
              nombre: {
                contains: nombreUsuario.trim(),
                mode: 'insensitive' as const,
              },
            },
          }
        : {}),
    };
    const [cajas, total] = await Promise.all([
      this.prisma.caja.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              celular: true,
              email: true,
            },
          },
          ventas: {
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
          },
          movimientos: {
            include: {
              solicitante: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              autorizador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          fechaApertura: 'desc',
        },
        skip: (pagina - 1) * limite,
        take: limite,
      }),

      this.prisma.caja.count({ where }),
    ]);

    return {
      datos: cajas,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

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
    // 1. Buscar la caja del usuario
    const caja = await this.prisma.caja.findFirst({
      where: {
        id: cajaId,
        usuarioId,
      },
    });

    if (!caja) {
      throw new NotFoundException('Caja no encontrada');
    }

    // 2. Comprobar que siga abierta
    if (caja.fechaCierre !== null) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // 3. Agrupar las ventas por método de pago
    const ventasPorMetodo = await this.prisma.venta.groupBy({
      by: ['metodoPago'],
      where: {
        cajaId,
      },
      _sum: {
        total: true,
      },
    });

    // 4. Obtener los totales de cada método de pago
    const obtenerTotal = (metodo: 'EFECTIVO' | 'TARJETA' | 'QR') => {
      const resultado = ventasPorMetodo.find(
        (venta) => venta.metodoPago === metodo,
      );

      return Math.round(Number(resultado?._sum.total ?? 0) * 100);
    };

    const totalEfectivo = obtenerTotal('EFECTIVO');
    const totalTarjeta = obtenerTotal('TARJETA');
    const totalQR = obtenerTotal('QR');

    // 5. Calcular los totales en centavos para evitar errores decimales
    const totalVentas = totalEfectivo + totalTarjeta + totalQR;

    const montoApertura = Math.round(Number(caja.montoApertura) * 100);

    const efectivoEsperado = montoApertura + totalEfectivo;

    const efectivoReportado = Math.round(datos.montoCierre * 100);

    const diferencia = efectivoReportado - efectivoEsperado;

    // 6. Cerrar la caja
    const cajaCerrada = await this.prisma.caja.update({
      where: {
        id: cajaId,
      },
      data: {
        montoCierre: datos.montoCierre,
        fechaCierre: new Date(),
      },
    });

    // 7. Devolver la caja y su conciliación
    return {
      mensaje: 'Caja cerrada correctamente',
      caja: cajaCerrada,
      conciliacion: {
        montoApertura: montoApertura / 100,
        totalVentas: totalVentas / 100,
        totalEfectivo: totalEfectivo / 100,
        totalTarjeta: totalTarjeta / 100,
        totalQR: totalQR / 100,
        efectivoEsperado: efectivoEsperado / 100,
        efectivoReportado: efectivoReportado / 100,
        diferencia: diferencia / 100,
      },
    };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CrearPedidoDto } from './dto/crear-pedido.dto.js';
import { PedidosService } from './pedidos.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Pedidos')
@ApiBearerAuth('JWT-auth')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener pedidos',
    description:
      'Obtiene los pedidos del usuario autenticado. Los clientes solo pueden consultar sus propios pedidos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedidos obtenidos correctamente.',
    schema: {
      example: [
        {
          id: 9,
          usuarioId: 5,
          direccionId: 3,
          destinatario: 'Cliente Demo',
          celularDestinatario: '70000000',
          total: '80.50',
          estado: 'PENDIENTE',
          origen: 'WEB',
          referenciaEntrega: 'Entregar por la tarde',
          creadoEn: '2026-10-08T17:00:00.000Z',
          detalles: [
            {
              id: 1,
              productoId: 2,
              cantidad: 1,
              precioUnitario: '80.50',
            },
          ],
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
    description: 'El usuario no tiene permisos para consultar pedidos.',
  })
  obtenerPedidos(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
  ) {
    return this.pedidosService.obtenerPedidos(
      solicitud.user.id,
      solicitud.user.rol,
    );
  }

  @Get(':pedidoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener pedido por ID',
    description:
      'Obtiene el detalle de un pedido perteneciente al usuario autenticado.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido',
    example: 9,
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido obtenido correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado o no pertenece al usuario.',
  })
  obtenerPedido(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ) {
    return this.pedidosService.obtenerPedido(
      solicitud.user.id,
      solicitud.user.rol,
      pedidoId,
    );
  }

  @Post()
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Crear pedido',
    description:
      'Crea un pedido para el cliente autenticado y reserva temporalmente el stock de los productos.',
  })
  @ApiBody({
    description: 'Datos del pedido',
    schema: {
      example: {
        direccionId: 3,
        detalles: [
          {
            productoId: 2,
            cantidad: 1,
          },
          {
            productoId: 5,
            cantidad: 2,
          },
        ],
        origen: 'WEB',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, stock insuficiente o dirección no válida.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los clientes pueden crear pedidos.',
  })
  crear(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: CrearPedidoDto,
  ) {
    return this.pedidosService.crear(solicitud.user.id, datos);
  }

  @Post('reservas/:reservaId/expirar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Expirar reserva',
    description:
      'Expira manualmente una reserva perteneciente al pedido del usuario autenticado.',
  })
  @ApiParam({
    name: 'reservaId',
    description: 'ID de la reserva',
    example: 9,
  })
  @ApiResponse({
    status: 201,
    description: 'Reserva expirada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'La reserva ya no puede expirar.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada o no pertenece al usuario.',
  })
  expirarReserva(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('reservaId', ParseIntPipe) reservaId: number,
  ) {
    return this.pedidosService.expirarReserva(solicitud.user.id, reservaId);
  }

  @Post(':pedidoId/cancelar')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Cancelar pedido',
    description:
      'Cancela un pedido pendiente perteneciente al cliente autenticado.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido que se desea cancelar',
    example: 9,
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido cancelado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'El pedido no puede ser cancelado en su estado actual.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado o no pertenece al usuario.',
  })
  cancelarPedido(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ) {
    return this.pedidosService.cancelarPedido(solicitud.user.id, pedidoId);
  }

  @Post(':pedidoId/enviar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Enviar pedido',
    description:
      'Cambia el estado de un pedido pagado a EN_TRANSITO. Disponible para ADMIN y CAJERO.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido que se desea enviar',
    example: 9,
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido enviado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'El pedido no se encuentra en un estado válido para ser enviado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden enviar pedidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado.',
  })
  enviarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.enviarPedido(pedidoId);
  }

  @Post(':pedidoId/entregar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Entregar pedido',
    description:
      'Cambia el estado de un pedido EN_TRANSITO a ENTREGADO. Disponible para ADMIN y CAJERO.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido que se desea entregar',
    example: 9,
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido entregado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'El pedido no se encuentra en tránsito.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden entregar pedidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado.',
  })
  entregarPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number) {
    return this.pedidosService.entregarPedido(pedidoId);
  }
}

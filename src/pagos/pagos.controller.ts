import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { MockPayWebhookDto } from './dto/mockpay-webhook.dto.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagosService } from './pagos.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get('pedido/:pedidoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener pagos de un pedido',
    description:
      'Obtiene los pagos asociados a un pedido. El cliente solo puede consultar sus propios pedidos.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido.',
    example: 9,
  })
  @ApiResponse({
    status: 200,
    description: 'Pagos obtenidos correctamente.',
    schema: {
      example: [
        {
          id: 1,
          pedidoId: 9,
          monto: '80.50',
          moneda: 'USD',
          estado: 'PENDIENTE',
          referencia: 'mockpay_transaction_123',
          creadoEn: '2026-10-08T18:30:00.000Z',
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
    description: 'El usuario no tiene permisos para consultar este pedido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado.',
  })
  obtenerPagosPorPedido(
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
    return this.pagosService.obtenerPagosPorPedido(
      solicitud.user.id,
      solicitud.user.rol,
      pedidoId,
    );
  }

  @Get(':pagoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener pago por ID',
    description:
      'Obtiene la información de un pago específico. El acceso respeta la pertenencia del pedido al usuario autenticado.',
  })
  @ApiParam({
    name: 'pagoId',
    description: 'ID del pago.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pago obtenido correctamente.',
    schema: {
      example: {
        id: 1,
        pedidoId: 9,
        monto: '80.50',
        moneda: 'USD',
        estado: 'PENDIENTE',
        referencia: 'mockpay_transaction_123',
        creadoEn: '2026-10-08T18:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'El usuario no tiene permisos para consultar este pago.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado.',
  })
  obtenerPago(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('pagoId', ParseIntPipe) pagoId: number,
  ) {
    return this.pagosService.obtenerPago(
      solicitud.user.id,
      solicitud.user.rol,
      pagoId,
    );
  }

  @Post('pedido/:pedidoId')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Crear pago',
    description:
      'Crea un pago para un pedido del cliente autenticado e inicia el proceso de pago mediante MockPay.',
  })
  @ApiParam({
    name: 'pedidoId',
    description: 'ID del pedido que se desea pagar.',
    example: 9,
  })
  @ApiBody({
    description:
      'Datos necesarios para iniciar el pago. El servicio valida que el pedido pertenezca al cliente autenticado.',
    type: CrearPagoDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Pago creado correctamente y checkout de MockPay generado.',
    schema: {
      example: {
        mensaje: 'Pago creado correctamente',
        pago: {
          id: 1,
          pedidoId: 9,
          monto: '80.50',
          moneda: 'USD',
          estado: 'PENDIENTE',
          referencia: 'mockpay_transaction_123',
          creadoEn: '2026-10-08T18:30:00.000Z',
        },
        checkoutUrl:
          'https://site-mock-payment.funvaltech.cloud/checkout/364bf1c2-3e36-4860-bead-a9b54ef8eb6d',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El pedido no puede ser pagado, ya tiene un pago pendiente o no tiene una reserva válida.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los clientes pueden crear pagos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido no encontrado o no pertenece al cliente autenticado.',
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
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Body() datos: CrearPagoDto,
  ) {
    return this.pagosService.crear(solicitud.user.id, pedidoId, datos);
  }

  @Post(':pagoId/aprobar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Aprobar pago',
    description: 'Aprueba manualmente un pago. Disponible para ADMIN y CAJERO.',
  })
  @ApiParam({
    name: 'pagoId',
    description: 'ID del pago que se desea aprobar.',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Pago aprobado correctamente.',
    schema: {
      example: {
        mensaje: 'Pago aprobado correctamente',
        pago: {
          id: 1,
          pedidoId: 9,
          monto: '80.50',
          moneda: 'USD',
          estado: 'APROBADO',
          referencia: 'mockpay_transaction_123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El pago no puede ser aprobado en su estado actual.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden aprobar pagos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado.',
  })
  aprobar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.aprobar(pagoId);
  }

  @Post(':pagoId/rechazar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Rechazar pago',
    description: 'Rechaza manualmente un pago. Disponible para ADMIN y CAJERO.',
  })
  @ApiParam({
    name: 'pagoId',
    description: 'ID del pago que se desea rechazar.',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Pago rechazado correctamente.',
    schema: {
      example: {
        mensaje: 'Pago rechazado correctamente',
        pago: {
          id: 1,
          pedidoId: 9,
          monto: '80.50',
          moneda: 'USD',
          estado: 'RECHAZADO',
          referencia: 'mockpay_transaction_123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El pago no puede ser rechazado en su estado actual.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo ADMIN y CAJERO pueden rechazar pagos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado.',
  })
  rechazar(@Param('pagoId', ParseIntPipe) pagoId: number) {
    return this.pagosService.rechazar(pagoId);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook de MockPay',
    description:
      'Endpoint utilizado por MockPay para notificar el resultado de un pago. No requiere JWT porque la comunicación es realizada directamente entre MockPay y el backend.',
  })
  @ApiBody({
    description: 'Notificación enviada por MockPay con el resultado del pago.',
    type: MockPayWebhookDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook recibido y procesado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos del webhook inválidos o pago no encontrado.',
  })
  webhook(@Body() datos: MockPayWebhookDto) {
    return this.pagosService.procesarWebhook(datos);
  }
}

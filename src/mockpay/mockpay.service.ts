import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MockPayService {
  constructor(private readonly configService: ConfigService) {}

  async crearPago(datos: {
    amount: number;
    currency: string;
    orderId: number;
  }) {
    const baseUrl = this.configService.getOrThrow<string>('MOCKPAY_BASE_URL');

    const secretKey =
      this.configService.getOrThrow<string>('MOCKPAY_SECRET_KEY');
    console.log('1. Iniciando petición a MockPay');
    const respuesta = await fetch(`${baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: datos.amount,
        currency: datos.currency,
        metadata: { order_id: String(datos.orderId) },
        webhook_url: 'https://pos-ecommerce-hibrido.onrender.com/pagos/webhook',
      }),
    });
    console.log('2. MockPay respondió:', respuesta.status);
    if (!respuesta.ok) {
      const error = await respuesta.text();

      throw new Error(`Error al crear el pago en MockPay: ${error}`);
    }

    const datosRespuesta = await respuesta.json();
    console.log('3. Respuesta procesada correctamente');

    return datosRespuesta;
  }
}

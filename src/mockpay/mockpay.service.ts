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

    const respuesta = await fetch(`${baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: datos.amount,
        currency: datos.currency,
        metadata: {
          order_id: String(datos.orderId),
        },
      }),
    });

    if (!respuesta.ok) {
      const error = await respuesta.text();

      throw new Error(`Error al crear el pago en MockPay: ${error}`);
    }

    const datosRespuesta = await respuesta.json();

    return datosRespuesta;
  }
}

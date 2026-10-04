import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { ProductosModule } from './productos/productos.module.js';
import { VentasModule } from './ventas/ventas.module.js';
import { CajasModule } from './cajas/cajas.module.js';
import { MovimientosCajaModule } from './movimientos-caja/movimientos-caja.module.js';
import { DireccionesModule } from './direcciones/direcciones.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CategoriasModule,
    ProductosModule,
    VentasModule,
    CajasModule,
    MovimientosCajaModule,
    DireccionesModule,
    PedidosModule,
    PagosModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

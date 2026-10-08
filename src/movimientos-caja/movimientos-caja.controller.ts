import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CrearMovimientoCajaDto } from './dto/crear-movimiento-caja.dto.js';
import { ResolverMovimientoCajaDto } from './dto/resolver-movimiento-caja.dto.js';
import { MovimientosCajaService } from './movimientos-caja.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('MovimientosCaja')
@ApiBearerAuth('JWT-auth')
@Controller('movimientos-caja')
export class MovimientosCajaController {
  constructor(
    private readonly movimientosCajaService: MovimientosCajaService,
  ) {}

  @Post('caja/:cajaId/solicitar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  crear(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: CrearMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.crear(cajaId, solicitud.user.id, datos);
  }

  @Patch(':id/resolver')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: ResolverMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.resolver(id, solicitud.user.id, datos);
  }
}

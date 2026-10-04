import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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

  @Post('caja/:cajaId/solicitar/:usuarioId')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  crear(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CrearMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.crear(cajaId, usuarioId, datos);
  }

  @Patch(':id/resolver/:usuarioId')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: ResolverMovimientoCajaDto,
  ) {
    return this.movimientosCajaService.resolver(id, usuarioId, datos);
  }
}

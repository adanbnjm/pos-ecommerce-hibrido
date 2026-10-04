import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';
import { CajasService } from './cajas.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Cajas')
@ApiBearerAuth('JWT-auth')
@Controller('cajas')
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post('abrir/:usuarioId')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  abrir(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: AbrirCajaDto,
  ) {
    return this.cajasService.abrir(usuarioId, datos);
  }

  @Post(':id/cerrar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cerrar(@Param('id', ParseIntPipe) id: number, @Body() datos: CerrarCajaDto) {
    return this.cajasService.cerrar(id, datos);
  }
}

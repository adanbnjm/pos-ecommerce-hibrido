import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CajasService } from './cajas.service.js';
import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Cajas')
@ApiBearerAuth('JWT-auth')
@Controller('cajas')
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post('abrir')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  abrir(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Body() datos: AbrirCajaDto,
  ) {
    return this.cajasService.abrir(solicitud.user.id, datos);
  }

  @Post(':id/cerrar')
  @Roles('ADMIN', 'CAJERO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  cerrar(
    @Req()
    solicitud: Request & {
      user: {
        id: number;
        email: string | null;
        rol: string;
      };
    },
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CerrarCajaDto,
  ) {
    return this.cajasService.cerrar(solicitud.user.id, id, datos);
  }
}

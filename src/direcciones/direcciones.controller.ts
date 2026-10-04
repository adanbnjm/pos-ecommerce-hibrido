import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CrearDireccionDto } from './dto/crear-direccion.dto.js';
import { DireccionesService } from './direcciones.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';

@ApiTags('Direcciones')
@ApiBearerAuth('JWT-auth')
@Controller('direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @Post('usuario/:usuarioId')
  @Roles('CLIENTE')
  @UseGuards(JwtAuthGuard, RolesGuard)
  crear(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CrearDireccionDto,
  ) {
    return this.direccionesService.crear(usuarioId, datos);
  }
}

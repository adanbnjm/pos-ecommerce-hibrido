import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('prueba-prisma')
  async probarPrisma() {
    const roles = await this.prisma.rol.findMany();

    return {
      mensaje: 'Prisma está funcionando correctamente',
      roles,
    };
  }
}
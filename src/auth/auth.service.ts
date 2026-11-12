import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CrearPersonalDto } from './dto/crear-personal.dto.js';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroClienteDto } from './dto/registro-cliente.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrarCliente(datos: RegistroClienteDto) {
    // 1. Comprobar si el correo ya está registrado.
    const correoExistente = await this.prisma.usuario.findUnique({
      where: { email: datos.email },
    });

    if (correoExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    // 2. Comprobar si el CI ya pertenece a otro usuario.
    if (datos.ci) {
      const ciExistente = await this.prisma.usuario.findUnique({
        where: { ci: datos.ci },
      });

      if (ciExistente) {
        throw new ConflictException('El CI ya está registrado');
      }
    }

    // 3. Buscar el rol CLIENTE.
    const rolCliente = await this.prisma.rol.findUnique({
      where: { nombre: 'CLIENTE' },
    });

    if (!rolCliente) {
      throw new InternalServerErrorException(
        'El rol CLIENTE no está configurado',
      );
    }

    // 4. Cifrar la contraseña.
    const passwordCifrada = await bcrypt.hash(datos.password, 10);

    // 5. Crear el usuario.
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        celular: datos.celular,
        ci: datos.ci,
        email: datos.email,
        password: passwordCifrada,
        rolId: rolCliente.id,
      },
      include: {
        rol: true,
      },
    });

    // 6. Generar el token JWT.
    const payload = {
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // 7. Responder sin exponer la contraseña.
    return {
      mensaje: 'Cliente registrado correctamente',
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
      },
    };
  }
  async crearPersonal(datos: CrearPersonalDto) {
    // 1. Comprobar si el correo ya está registrado.
    const correoExistente = await this.prisma.usuario.findUnique({
      where: { email: datos.email },
    });

    if (correoExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    // 2. Comprobar si el CI ya pertenece a otro usuario.
    if (datos.ci) {
      const ciExistente = await this.prisma.usuario.findUnique({
        where: { ci: datos.ci },
      });

      if (ciExistente) {
        throw new ConflictException('El CI ya está registrado');
      }
    }

    // 3. Buscar el rol solicitado en la base de datos.
    const rol = await this.prisma.rol.findUnique({
      where: { nombre: datos.rol },
    });

    if (!rol) {
      throw new InternalServerErrorException(
        `El rol ${datos.rol} no está configurado`,
      );
    }

    // 4. Cifrar la contraseña.
    const passwordCifrada = await bcrypt.hash(datos.password, 10);

    // 5. Crear el usuario con el rol correspondiente.
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        celular: datos.celular,
        ci: datos.ci,
        email: datos.email,
        password: passwordCifrada,
        rolId: rol.id,
      },
      include: {
        rol: true,
      },
    });

    // 6. Responder sin exponer la contraseña.
    return {
      mensaje: 'Personal creado correctamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
      },
    };
  }

  async login(datos: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: datos.email },
      include: { rol: true },
    });

    if (!usuario || !usuario.password) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const contraseñaCorrecta = await bcrypt.compare(
      datos.password,
      usuario.password,
    );

    if (!contraseñaCorrecta) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const payload = {
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Inicio de sesión correcto',
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
      },
    };
  }
}

import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // =========================
  // ROLES
  // =========================

  const roles = ['ADMIN', 'CAJERO', 'CLIENTE'];

  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  const rolCajero = await prisma.rol.findUniqueOrThrow({
    where: { nombre: 'CAJERO' },
  });

  const rolAdmin = await prisma.rol.findUniqueOrThrow({
    where: { nombre: 'ADMIN' },
  });

  await prisma.usuario.upsert({
    where: { email: 'admin@pos.local' },
    update: {
      password: '$2b$10$XmEZfDniSgbF7NQJtl4.aef/gvlFF2Nau2qmqYEo320VjM4TlXVOW',
      rolId: rolAdmin.id,
    },
    create: {
      nombre: 'Administrador Principal',
      celular: '70000001',
      email: 'admin@pos.local',
      password: '$2b$10$XmEZfDniSgbF7NQJtl4.aef/gvlFF2Nau2qmqYEo320VjM4TlXVOW',
      rolId: rolAdmin.id,
    },
  });

  console.log('Usuarios iniciales creados correctamente.');
  console.log('Roles iniciales creados correctamente.');

  // =========================
  // CATEGORÍAS
  // =========================

  const categorias = [
    {
      nombre: 'Lubricantes',
      descripcion: 'Aceites y productos para lubricación de vehículos',
    },
    {
      nombre: 'Accesorios',
      descripcion: 'Accesorios y complementos para vehículos',
    },
    {
      nombre: 'Repuestos',
      descripcion: 'Repuestos y componentes para vehículos',
    },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: {
        descripcion: categoria.descripcion,
      },
      create: categoria,
    });
  }

  console.log('Categorías iniciales creadas correctamente.');

  // Buscamos las categorías para obtener sus IDs
  const categoriaLubricantes = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: 'Lubricantes' },
  });

  const categoriaAccesorios = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: 'Accesorios' },
  });

  const categoriaRepuestos = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: 'Repuestos' },
  });

  // =========================
  // PRODUCTOS
  // =========================

  const productos = [
    {
      codigo: 'LUB-001',
      nombre: 'Aceite sintético 10W-40',
      descripcion: 'Aceite sintético para motores de vehículos',
      precioActual: 80.5,
      costoAdquisicion: 50,
      stock: 10,
      activo: true,
      categoriaId: categoriaLubricantes.id,
    },
    {
      codigo: 'LUB-002',
      nombre: 'Aceite mineral 20W-50',
      descripcion: 'Aceite mineral para motores de vehículos',
      precioActual: 65,
      costoAdquisicion: 40,
      stock: 15,
      activo: true,
      categoriaId: categoriaLubricantes.id,
    },
    {
      codigo: 'ACC-001',
      nombre: 'Casco para motocicleta',
      descripcion: 'Casco de seguridad para motociclistas',
      precioActual: 250,
      costoAdquisicion: 180,
      stock: 8,
      activo: true,
      categoriaId: categoriaAccesorios.id,
    },
    {
      codigo: 'ACC-002',
      nombre: 'Guantes para motocicleta',
      descripcion: 'Guantes de protección para motociclistas',
      precioActual: 120,
      costoAdquisicion: 75,
      stock: 12,
      activo: true,
      categoriaId: categoriaAccesorios.id,
    },
    {
      codigo: 'REP-001',
      nombre: 'Filtro de aceite',
      descripcion: 'Filtro de aceite para vehículos',
      precioActual: 45,
      costoAdquisicion: 28,
      stock: 20,
      activo: true,
      categoriaId: categoriaRepuestos.id,
    },
    {
      codigo: 'REP-002',
      nombre: 'Pastillas de freno',
      descripcion: 'Pastillas de freno para vehículos',
      precioActual: 180,
      costoAdquisicion: 110,
      stock: 10,
      activo: true,
      categoriaId: categoriaRepuestos.id,
    },
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: {
        codigo: producto.codigo,
      },
      update: {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precioActual: producto.precioActual,
        costoAdquisicion: producto.costoAdquisicion,
        stock: producto.stock,
        activo: producto.activo,
        categoriaId: producto.categoriaId,
      },
      create: producto,
    });
  }

  console.log('Productos iniciales creados correctamente.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

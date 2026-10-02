import { PrismaService } from './prisma.service.js';

async function probarPrisma() {
  const prisma = new PrismaService({
    getOrThrow: (clave: string) => {
      if (clave === 'DATABASE_URL') {
        return process.env.DATABASE_URL;
      }

      throw new Error(`Variable no encontrada: ${clave}`);
    },
  } as any);

  const roles = await prisma.rol.findMany();

  console.log('Roles encontrados:', roles);

  await prisma.$disconnect();
}

probarPrisma().catch((error) => {
  console.error('Error:', error);
});
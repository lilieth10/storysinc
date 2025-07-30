import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.log('✅ Ya existe un usuario admin:', existingAdmin.email);
      return;
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        fullName: 'Administrador',
        email: 'admin@storysinc.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        avatar: null,
      },
    });

    console.log('✅ Usuario admin creado exitosamente:');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Contraseña: admin123');
    console.log('👤 Nombre:', admin.fullName);
    console.log('🔐 Rol:', admin.role);
  } catch (error) {
    console.error('❌ Error creando admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

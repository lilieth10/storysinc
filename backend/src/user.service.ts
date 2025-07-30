import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { NotificationGateway } from './notification.gateway';

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  password?: string;
  birthdate?: Date;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        birthdate: true,
        address: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: number, data: UpdateUserDto) {
    const { password, birthdate, fullName, email, phone, address, avatar } =
      data;
    const updateData: Partial<{
      fullName: string;
      email: string;
      phone: string;
      address: string;
      avatar: string;
      birthdate: Date;
      password: string;
    }> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (birthdate) updateData.birthdate = new Date(birthdate);
    if (password) {
      const salt: string = await bcrypt.genSalt();

      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  }
}

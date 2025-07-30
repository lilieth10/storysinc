import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './auth/dto/register.dto';
import { LoginDto } from './auth/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(
    data: RegisterDto,
  ): Promise<{ id: number; fullName: string; email: string; role: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email ya registrado');
    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        fullName: data.fullName,
        username: data.username,
        role: 'user', // Por defecto todos son usuarios
      },
    });
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,

      role: user.role,
    };
  }

  async validateUser(
    emailOrUsername: string,
    password: string,
  ): Promise<null | {
    id: number;
    fullName: string;
    email: string;
    password: string;
    role: string;
  }> {
    // Buscar por email o username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return user;
  }

  async login(data: LoginDto): Promise<{
    access_token: string;
    user: { id: number; fullName: string; email: string; role: string };
  }> {
    const user = await this.validateUser(data.email, data.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}

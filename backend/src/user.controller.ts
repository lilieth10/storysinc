/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { UserService, UpdateUserDto } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    // @ts-expect-error: userId viene del JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userService.getProfile(req.user.userId);
  }

  @Put('me')
  async updateProfile(@Req() req: Request, @Body() data: UpdateUserDto) {
    // @ts-expect-error: userId viene del JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userService.updateProfile(req.user.userId, data);
  }

  @Get('stats')
  async getUserStats(@Req() req: Request) {
    // @ts-expect-error: userId viene del JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userService.getUserStats(req.user.userId);
  }

  @Get('test')
  async test() {
    return { message: 'UserController funcionando correctamente' };
  }
}

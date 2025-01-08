import {
  Controller,
  Body,
  Post,
  HttpCode,
  UseGuards,
  Delete,
  Req,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create_user.dto';
import { JwtAuthGuard } from '../common/guards/jwt/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() CreateUserDto: CreateUserDto) {
    const { email, password } = CreateUserDto;
    await this.usersService.createUser(email, password);
    return { message: 'User created successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Req() req: any) {
    const userId = req.user.userId;
    await this.usersService.deleteUser(userId);
    return { message: 'User deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.getUserById(req.user.userId);
  }
}

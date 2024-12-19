import { Controller, Body, Post, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create_user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(201)
  async register(@Body() CreateUserDto: CreateUserDto) {
    const { email, password } = CreateUserDto;
    await this.usersService.createUser(email, password);
    return { message: 'User created successfully' };
  }
}

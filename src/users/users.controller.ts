import { Controller, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create_user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async register(@Body() CreateUserDto: CreateUserDto) {
    const { email, password } = CreateUserDto;
    return this.usersService.createUser(email, password);
  }
}

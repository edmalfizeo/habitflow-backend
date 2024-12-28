import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create_task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        deadline: data.deadline,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}

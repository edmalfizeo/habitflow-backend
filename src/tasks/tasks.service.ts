import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create_task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTaskDto, userId: string) {
    try {
      return await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          deadline: data.deadline,
          user: {
            connect: { id: userId },
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async listAll(userId: string) {
    try {
      return await this.prisma.task.findMany({
        where: {
          userId,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException('Failed to list tasks');
    }
  }

  async getTask(taskId: string, userId: string) {
    try {
      const task = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return task;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve task');
    }
  }

  async updateTask(taskId: string, data: CreateTaskDto, userId: string) {
    try {
      const task = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return await this.prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          deadline: data.deadline,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }
}

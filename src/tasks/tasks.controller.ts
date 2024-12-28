import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt/jwt.guard';
import { TasksService } from './tasks.service';
import { createTaskSchema } from './dto/create_task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTask(@Req() req: any, @Body() body: any) {
    const parsedData = createTaskSchema.parse(body);
    const userId = req.user.userId;

    const task = await this.tasksService.create(parsedData, userId);
    return { message: 'Task created successfully', task };
  }
}

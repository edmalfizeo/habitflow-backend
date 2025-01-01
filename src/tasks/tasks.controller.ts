import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get()
  async listAllTasks(@Req() req: any) {
    const userId = req.user.userId;
    const tasks = await this.tasksService.listAll(userId);
    return { tasks };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTask(@Req() req: any) {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const task = await this.tasksService.getTask(taskId, userId);
    return { task };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTask(@Req() req: any, @Body() body: any) {
    const parsedData = createTaskSchema.parse(body);
    const userId = req.user.userId;
    const taskId = req.params.id;

    const task = await this.tasksService.updateTask(taskId, parsedData, userId);
    return { message: 'Task updated successfully', task };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTask(@Req() req: any) {
    const userId = req.user.userId;
    const taskId = req.params.id;

    await this.tasksService.deleteTask(taskId, userId);
    return { message: 'Task deleted successfully' };
  }
}

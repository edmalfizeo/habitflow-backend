import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from '../common/guards/jwt/jwt.guard';

@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @UseGuards(JwtAuthGuard)
  @Get('general')
  async getGeneralSummary(@Req() req: { user: { userId: string } }) {
    return this.summaryService.getGeneralSummary(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getProgress(@Req() req) {
    return this.summaryService.getProgress(req.user.userId);
  }
}

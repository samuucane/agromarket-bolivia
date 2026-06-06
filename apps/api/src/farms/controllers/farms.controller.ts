import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { FarmsService } from '../services/farms.service';

@ApiTags('farms')
@Controller('farms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FarmsController {
  constructor(private farmsService: FarmsService) {}

  @Get() getMyFarms(@CurrentUser() user: User) { return this.farmsService.getMyFarms(user.id); }
  @Post() createFarm(@CurrentUser() user: User, @Body() dto: any) { return this.farmsService.createFarm(user.id, user.id, dto); }
  @Get(':id/dashboard') getDashboard(@CurrentUser() user: User, @Param('id') id: string) { return this.farmsService.getFarmDashboard(id, user.id); }
  @Post(':id/cycles') startCycle(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: any) { return this.farmsService.startCycle(id, user.id, dto); }
  @Post('cycles/:cycleId/expenses') addExpense(@CurrentUser() user: User, @Param('cycleId') id: string, @Body() dto: any) { return this.farmsService.addExpense(id, user.id, dto); }
  @Get(':id/weather') getWeather(@CurrentUser() user: User, @Param('id') id: string) { return this.farmsService.getFarmWeather(id, user.id); }
}

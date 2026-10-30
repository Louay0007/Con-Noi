import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkHistoryService } from './work-history.service';
import { CreateWorkHistoryDto, UpdateWorkHistoryDto, ReorderWorkHistoryDto } from './dto/work-history.dto';

@ApiTags('Work History')
@Controller('work-history')
@UseGuards(JwtAuthGuard)
export class WorkHistoryController {
  constructor(private workHistoryService: WorkHistoryService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own work history entries' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.workHistoryService.findAll(userId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a work history entry' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkHistoryDto) {
    return this.workHistoryService.create(userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a work history entry' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkHistoryDto,
  ) {
    return this.workHistoryService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a work history entry' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.workHistoryService.remove(userId, id);
    return { ok: true };
  }

  @Post('reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder work history entries' })
  async reorder(@CurrentUser('id') userId: string, @Body() dto: ReorderWorkHistoryDto) {
    await this.workHistoryService.reorder(userId, dto.ids);
    return { ok: true };
  }
}
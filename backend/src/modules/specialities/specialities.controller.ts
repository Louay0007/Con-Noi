import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SpecialitiesService } from './specialities.service';

@ApiTags('Specialities')
@Controller('specialities')
export class SpecialitiesController {
  constructor(private specialitiesService: SpecialitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get active specialities catalogue' })
  async findAll() {
    return this.specialitiesService.findAllActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create speciality (admin)' })
  async create(@Body() body: { name: string; category: string; icon?: string; color?: string; description?: string }) {
    return this.specialitiesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update speciality (admin)' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; category: string; icon: string; color: string; description: string; sortOrder: number; isActive: boolean }>,
  ) {
    return this.specialitiesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate speciality (admin)' })
  async deactivate(@Param('id') id: string) {
    await this.specialitiesService.deactivate(id);
    return { ok: true };
  }
}
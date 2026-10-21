import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard statistics' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics/specialities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Speciality demand report' })
  async getSpecialityDemand() {
    return this.adminService.getSpecialityDemand();
  }

  @Get('analytics/funnel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Application funnel' })
  async getFunnel() {
    return this.adminService.getApplicationFunnel();
  }

  @Get('analytics/top-posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top posts by applications' })
  async getTopPosts() {
    return this.adminService.getTopPosts();
  }
}
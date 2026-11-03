import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { ApplicationsQueryDto } from '../../common/dto/query.dto';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post('posts/:postId/apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to a post' })
  async apply(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { coverLetter?: string; attachmentFileIds?: string[]; contact?: { phone?: string; email?: string; availabilityNote?: string }; resumeFileId?: string },
  ) {
    return this.applicationsService.apply(postId, userId, body, body.resumeFileId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own applications' })
  async findMine(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.applicationsService.findMine(userId, status);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Application detail (owner or admin only)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.applicationsService.findByIdForUser(id, user.id, user.role);
  }

  @Post(':id/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw own application' })
  async withdraw(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.applicationsService.withdraw(id, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all applications (admin)' })
  async findAll(@Query() query: ApplicationsQueryDto) {
    return this.applicationsService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      postId: query.postId,
    });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review application (admin)' })
  async review(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { status: 'reviewed' | 'accepted' | 'rejected'; reviewNotes?: string },
  ) {
    return this.applicationsService.review(id, adminId, body.status, body.reviewNotes);
  }
}
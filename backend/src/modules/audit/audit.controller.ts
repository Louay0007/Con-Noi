import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query audit logs (admin)' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('actorId') actorId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.findAll({
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      actorId,
      entity,
      action,
      from,
      to,
    });
  }
}
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from '../../common/dto/query.dto';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query audit logs (admin)' })
  async findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      actorId: query.actorId,
      entity: query.entity,
      action: query.action,
      from: query.from,
      to: query.to,
    });
  }
}
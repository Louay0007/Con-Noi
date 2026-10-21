import {
  Controller, Get, Patch, Put, Delete, Post,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import {
  UpdateProfileDto, UpdateSpecialitiesDto, ChangePasswordDto,
  AdminUpdateUserDto, AdminUpdateStatusDto,
} from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.toSafeProfile(user!);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return this.usersService.toSafeProfile(user);
  }

  @Put('me/specialities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace own specialities' })
  async updateMySpecialities(@CurrentUser('id') userId: string, @Body() dto: UpdateSpecialitiesDto) {
    const user = await this.usersService.replaceSpecialities(userId, dto.specialityIds);
    return this.usersService.toSafeProfile(user);
  }

  @Post('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(userId, dto);
    return { ok: true };
  }

  @Get('me/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export own data (GDPR)' })
  async exportMe(@CurrentUser('id') userId: string) {
    return this.usersService.exportUserData(userId);
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own account and anonymize PII (GDPR)' })
  async deleteMe(@CurrentUser('id') userId: string) {
    await this.usersService.gdprDelete(userId);
    return { ok: true };
  }

  // ---- Admin endpoints ----

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (admin)' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('specialityId') specialityId?: string,
    @Query('city') city?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.usersService.findAll({
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      specialityId,
      city,
      q,
      sort,
    });
    return {
      items: result.items.map((u) => this.usersService.toSafeProfile(u)),
      total: result.total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user detail (admin)' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.usersService.toSafeProfile(user!);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (admin)' })
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    if (dto.specialityIds) {
      await this.usersService.replaceSpecialities(id, dto.specialityIds);
    }
    const user = await this.usersService.updateProfile(id, dto);
    return this.usersService.toSafeProfile(user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/deactivate user (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    if (!dto.isActive) {
      await this.usersService.deactivate(id, adminId);
    } else {
      const user = await this.usersService.findById(id);
      if (user) {
        user.isActive = true;
        await user.save();
      }
    }
    return { ok: true };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete user (admin)' })
  async adminDelete(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    await this.usersService.softDelete(id, adminId);
    return { ok: true };
  }
}
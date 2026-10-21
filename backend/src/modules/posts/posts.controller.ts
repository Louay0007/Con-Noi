import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostStatusDto, PostFilterDto } from './dto/post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'For You feed (personalised matching)' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userSpecialities: string[] = []; // TODO: inject UsersService or pass via guard
    const result = await this.postsService.findForYou(userId, userSpecialities, undefined, cursor, limit ? parseInt(limit, 10) : 20);
    return { items: result.items, nextCursor: result.nextCursor };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Browse published posts with filters' })
  async findAll(@Query() filters: PostFilterDto, @Query() pagination: PaginationDto) {
    const result = await this.postsService.findPublished(filters, pagination.page ?? 1, pagination.limit ?? 20);
    return { items: result.items, total: result.total, page: pagination.page ?? 1, limit: pagination.limit ?? 20 };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Post detail (increments view counter)' })
  async findOne(@Param('id') id: string) {
    const post = await this.postsService.findById(id);
    if (!post) return null;
    await this.postsService.incrementView(id);
    return post;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create post (admin)' })
  async create(@Body() dto: CreatePostDto, @CurrentUser('id') adminId: string) {
    return this.postsService.create(dto, adminId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser('id') adminId: string) {
    return this.postsService.update(id, dto, adminId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change post lifecycle status (admin)' })
  async changeStatus(@Param('id') id: string, @Body() dto: PostStatusDto, @CurrentUser('id') adminId: string) {
    return this.postsService.changeStatus(id, dto.action, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete post (admin)' })
  async remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    await this.postsService.softDelete(id, adminId);
  }
}
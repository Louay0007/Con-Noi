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
import { UsersService } from '../users/users.service';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostStatusDto, PostFilterDto } from './dto/post.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
  ) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'For You feed (personalised matching)' })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const user = await this.usersService.findById(userId);
    const userSpecialities = (user?.specialityIds ?? []).map((id) => id.toString());
    const result = await this.postsService.findForYou(
      userId,
      userSpecialities,
      user?.city ?? undefined,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
    return { items: result.items, nextCursor: result.nextCursor };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Browse published posts with filters' })
  async findAll(@Query() filters: PostFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const result = await this.postsService.findPublished(filters, page, limit);
    return { items: result.items, total: result.total, page, limit };
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
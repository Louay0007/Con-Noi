import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LikesService } from './likes.service';

@ApiTags('Likes')
@Controller()
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private likesService: LikesService) {}

  @Post('posts/:id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  async toggleLike(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.likesService.toggle(userId, id);
  }

  @Delete('posts/:id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a post (idempotent)' })
  async unlike(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.likesService.toggle(userId, id);
    if (result.liked) {
      // Was not liked before, so toggle added it; toggle again to remove
      return this.likesService.toggle(userId, id);
    }
    return { liked: false };
  }

  @Get('likes/ids')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get array of liked post IDs' })
  async getLikedIds(@CurrentUser('id') userId: string) {
    return this.likesService.getLikedIds(userId);
  }
}
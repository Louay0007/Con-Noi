import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('threads')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own conversations' })
  async getThreads(@CurrentUser('id') userId: string) {
    return this.messagesService.getThreads(userId);
  }

  @Post('threads')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find or create a conversation thread' })
  async createThread(
    @CurrentUser('id') userId: string,
    @Body() body: { recipientId: string; postId?: string; applicationId?: string; context?: string },
  ) {
    return this.messagesService.findOrCreateThread({
      senderId: userId,
      recipientId: body.recipientId,
      postId: body.postId,
      applicationId: body.applicationId,
      context: body.context,
    });
  }

  @Get('threads/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages in a thread (marks as read)' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(id, userId, cursor, limit ? parseInt(limit, 10) : 50);
  }

  @Post('threads/:id/messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message in a thread' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { body?: string; attachmentFileIds?: string[] },
  ) {
    return this.messagesService.sendMessage({
      threadId: id,
      senderId: userId,
      body: body.body,
      attachmentFileIds: body.attachmentFileIds,
    });
  }

  @Patch('threads/:id/read')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark entire thread as read' })
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.messagesService.markThreadRead(id, userId);
  }

  @Patch('threads/:id/close')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close a conversation thread' })
  async closeThread(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.messagesService.closeThread(id, userId);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total unread message count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.messagesService.getUnreadCount(userId);
    return { count };
  }
}
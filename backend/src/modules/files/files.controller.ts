import {
  Controller, Post, Get, Delete, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import type { File as MulterFile } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiQuery({ name: 'purpose', required: true, enum: [
    'resume', 'avatar', 'certificate', 'work_sample',
    'post_cover', 'post_gallery', 'post_attachment',
    'application_attachment', 'history_attachment', 'message_attachment', 'company_logo',
  ] })
  @ApiQuery({ name: 'ownerType', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024, files: 1 } }))
  async upload(
    @UploadedFile() file: MulterFile,
    @Query('purpose') purpose: string,
    @Query('ownerType') ownerType: string | undefined,
    @Query('ownerId') ownerId: string | undefined,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (!file) throw new Error('No file provided');
    const resolvedOwnerType = ownerType || 'user';
    const resolvedOwnerId = ownerId || user.id;
    const doc = await this.filesService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      purpose,
      ownerType: resolvedOwnerType,
      ownerId: resolvedOwnerId,
      userId: user.id,
      userRole: user.role,
    });
    return {
      id: doc._id.toString(),
      url: doc.url,
      originalName: doc.originalName,
      sizeBytes: doc.sizeBytes,
      mimeType: doc.mimeType,
      checksum: doc.checksum,
      scanStatus: doc.scanStatus,
    };
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own uploaded files' })
  async findMine(@CurrentUser('id') userId: string) {
    return this.filesService.findMine(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file metadata' })
  async findOne(@Param('id') id: string) {
    const file = await this.filesService.findById(id);
    if (!file) throw new Error('File not found');
    return {
      id: file._id.toString(),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      purpose: file.purpose,
      visibility: file.visibility,
      scanStatus: file.scanStatus,
      createdAt: (file as any).createdAt,
    };
  }

  @Get('download/:key(*)')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a file by storage key' })
  async download(
    @Param('key') key: string,
    @CurrentUser() user: { id: string; role: string },
    @Res() res: Response,
  ) {
    const file = await this.filesService.findByStorageKey(key);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    if (!this.filesService.canAccess(file, user.id, user.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    const stream = await this.filesService.getStream(file);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.sizeBytes,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a file' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    await this.filesService.softDelete(id, user.id, user.role);
    return { ok: true };
  }
}
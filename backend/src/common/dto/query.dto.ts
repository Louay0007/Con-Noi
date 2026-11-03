import { IsOptional, IsString, IsIn, IsMongoId, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

/**
 * Filters live on their own DTOs rather than loose `@Query('x')` params:
 * the global ValidationPipe runs with `forbidNonWhitelisted`, so any query
 * key that is not declared on the validated DTO is rejected with a 400.
 */

// `transformOptions.enableImplicitConversion` turns the string "false" into
// Boolean("false") === true, so booleans arrive as `true` no matter what the
// client sent. Keep them as strings and convert explicitly where they are used.
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class UsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['worker', 'admin'] })
  @IsOptional()
  @IsIn(['worker', 'admin'])
  role?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsMongoId()
  specialityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Free-text search' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}

export class ApplicationsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn'] })
  @IsOptional()
  @IsIn(['submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsMongoId()
  postId?: string;
}

export class AuditQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsMongoId()
  actorId?: string;

  @ApiPropertyOptional({ enum: ['post', 'user', 'application', 'file', 'speciality', 'message'] })
  @IsOptional()
  @IsIn(['post', 'user', 'application', 'file', 'speciality', 'message'])
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  to?: string;
}

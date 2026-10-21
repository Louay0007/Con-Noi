import { IsString, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, IsMongoId, IsBoolean, IsNumber, Min, Max, ValidateNested, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: 'Milano' })
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ default: 'Italia' })
  @IsOptional()
  @IsString()
  country?: string = 'Italia';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  remote?: boolean = false;
}

export class SalaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({ enum: ['hour', 'day', 'month', 'year'], default: 'month' })
  @IsOptional()
  @IsString()
  period?: string = 'month';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean = false;
}

export class CompanyDto {
  @ApiProperty({ example: 'Edilizia Rossi Srl' })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  logoFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'] })
  @IsOptional()
  @IsString()
  size?: string;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Muratore esperto per ristrutturazione' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  summary?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(8000)
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsMongoId({ each: true })
  specialityIds: string[];

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ enum: ['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'] })
  @IsEnum(['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'])
  employmentType: string;

  @ApiPropertyOptional({ enum: ['permanent', 'fixed_term', 'seasonal', 'noleggio', 'stage'] })
  @IsOptional()
  @IsString()
  contractType?: string;

  @ApiPropertyOptional({ type: SalaryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @ApiProperty({ type: CompanyDto })
  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  coverFileId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  galleryFileIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicationDeadline?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  openings?: number;

  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string = 'draft';
}

export class UpdatePostDto extends CreatePostDto {}

export class PostStatusDto {
  @ApiProperty({ enum: ['publish', 'close', 'archive', 'restore'] })
  @IsEnum(['publish', 'close', 'archive', 'restore'])
  action: string;
}

export class PostFilterDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  specialityIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['recent', 'salary', 'match'], default: 'recent' })
  @IsOptional()
  @IsString()
  sort?: string = 'recent';
}
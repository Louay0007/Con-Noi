import { IsString, IsOptional, IsArray, ArrayMaxSize, IsMongoId, IsBoolean, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkHistoryDto {
 @ApiProperty({ example: 'Muratore Senior' })
 @IsString()
 @MaxLength(120)
 positionTitle: string;

 @ApiProperty({ example: 'Edilizia Rossi Srl' })
 @IsString()
 @MaxLength(120)
 companyName: string;

 @ApiPropertyOptional({ type: [String] })
 @IsOptional()
 @IsArray()
 @ArrayMaxSize(6)
 @IsMongoId({ each: true })
 specialityIds?: string[];

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 location?: string;

 @ApiPropertyOptional({ enum: ['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'] })
 @IsOptional()
 @IsEnum(['full_time', 'part_time', 'contract', 'temporary', 'seasonal', 'internship'])
 employmentType?: string;

 @ApiProperty({ example: '2020-03-01' })
 @IsDateString()
 startDate: string;

 @ApiPropertyOptional({ example: '2024-06-30' })
 @IsOptional()
 @IsDateString()
 endDate?: string;

 @ApiPropertyOptional()
 @IsOptional()
 @IsString()
 @MaxLength(1000)
 description?: string;

 @ApiPropertyOptional({ default: true })
 @IsOptional()
 @IsBoolean()
 isExternal?: boolean = true;

 @ApiPropertyOptional({ default: false })
 @IsOptional()
 @IsBoolean()
 isCurrent?: boolean = false;

 @ApiPropertyOptional({ type: [String] })
 @IsOptional()
 @IsArray()
 @ArrayMaxSize(3)
 @IsMongoId({ each: true })
 attachmentFileIds?: string[];
}

export class UpdateWorkHistoryDto extends CreateWorkHistoryDto {}

export class ReorderWorkHistoryDto {
 @ApiProperty({ type: [String], description: 'Ordered array of work history IDs' })
 @IsArray()
 @IsMongoId({ each: true })
 ids: string[];
}
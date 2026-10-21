import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max, IsArray, ArrayMinSize, ArrayMaxSize, IsMongoId, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'mario@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, { message: 'Password must contain at least one uppercase letter and one digit' })
  password: string;

  @ApiProperty({ example: 'Mario Rossi' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiPropertyOptional({ example: 34 })
  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(99)
  age?: number;

  @ApiPropertyOptional({ example: '+39 333 1234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s]{6,20}$/)
  phone?: string;

  @ApiPropertyOptional({ example: 'Milano' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439011'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsMongoId({ each: true })
  specialityIds: string[];
}

export class LoginDto {
  @ApiProperty({ example: 'mario@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class RefreshDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'mario@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/)
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}
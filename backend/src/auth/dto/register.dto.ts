import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  email: string; // Puede ser email o username

  @IsString()
  password: string;
}

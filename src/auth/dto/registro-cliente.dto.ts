import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistroClienteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(20)
  celular: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  ci?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

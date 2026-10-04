import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearDireccionDto {
  @IsString()
  @IsNotEmpty()
  departamento: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  zona: string;

  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  referencia?: string;
}

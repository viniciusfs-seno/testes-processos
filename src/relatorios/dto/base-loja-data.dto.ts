import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseLojaDataDto {
  @IsDateString({}, { message: 'data deve estar no formato YYYY-MM-DD.' })
  data: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'cdLoja deve ser maior que 0 para consulta de detalhe.' })
  cdLoja: number;
}

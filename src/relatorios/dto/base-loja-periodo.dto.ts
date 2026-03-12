import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePeriodoDto } from './base-periodo.dto';

export class BaseLojaPeriodoDto extends BasePeriodoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cdLoja?: number = 0; // 0 = todas as lojas
}

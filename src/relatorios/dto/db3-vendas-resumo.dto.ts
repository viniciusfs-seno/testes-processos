import { BasePeriodoDto } from './base-periodo.dto';
import { IsOptional, IsString } from 'class-validator';

export class Db3VendasResumoDto extends BasePeriodoDto {
  // Ex: "51,52,53" (opcional)
  @IsOptional()
  @IsString()
  segmentos?: string;
}

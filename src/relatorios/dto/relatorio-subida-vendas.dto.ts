import { IsDateString, IsOptional } from 'class-validator';

export class RelatorioSubidaVendasDto {
  @IsOptional()
  @IsDateString({}, { message: 'dataIni deve estar no formato YYYY-MM-DD.' })
  dataIni?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dataFim deve estar no formato YYYY-MM-DD.' })
  dataFim?: string;
}

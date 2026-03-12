import { IsDateString } from 'class-validator';

export class BasePeriodoDto {
  @IsDateString({}, { message: 'dataIni deve estar no formato YYYY-MM-DD.' })
  dataIni: string;

  @IsDateString({}, { message: 'dataFim deve estar no formato YYYY-MM-DD.' })
  dataFim: string;
}

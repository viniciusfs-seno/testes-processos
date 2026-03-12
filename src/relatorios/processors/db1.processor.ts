import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db1Client } from '../db1.client';

@Processor('db1-relatorios')
export class Db1Processor {
  constructor(private readonly db1Client: Db1Client) {}

  @Process('resumo-cnsd')
  async handleResumoCnsd(job: Job) {
    const { dataIni, dataFim } = job.data;

    job.log(`Iniciando consulta DB1: ${dataIni} até ${dataFim}`);
    await job.progress(10);

    const registros = await this.db1Client.resumoCnsd(dataIni, dataFim);

    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);

    return {
      database: 'DB1',
      periodo: { inicio: dataIni, fim: dataFim },
      registros,
    };
  }
}

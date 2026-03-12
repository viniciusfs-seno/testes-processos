import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db2Client } from '../db2.client';

@Processor('db2-relatorios')
export class Db2Processor {
  constructor(private readonly db2Client: Db2Client) {}

  @Process('vendas-resumo')
  async handleVendasResumo(job: Job) {
    const { dataIni, dataFim } = job.data;

    job.log(`Iniciando consulta DB2: ${dataIni} até ${dataFim}`);
    await job.progress(10);

    const registros = await this.db2Client.vendasEmporiumResumo(dataIni, dataFim);

    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);

    return {
      database: 'DB2 - Emporium',
      periodo: { inicio: dataIni, fim: dataFim },
      registros,
    };
  }
}

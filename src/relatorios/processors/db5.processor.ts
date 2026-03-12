import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db5Client } from '../db5.client';

@Processor('db5-relatorios')
export class Db5Processor {
  constructor(private readonly db5Client: Db5Client) {}

  @Process('nf-resumo')
  async handleNfResumo(job: Job) {
    const { dataIni, dataFim, cdLoja = 0 } = job.data;
    job.log(`Iniciando DB5 (Oracle MDLog) - Resumo NF: ${dataIni} até ${dataFim}, loja: ${cdLoja}`);
    await job.progress(10);
    const registros = await this.db5Client.nfResumo(dataIni, dataFim, cdLoja);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);
    return {
      database: 'DB5 - MDLog (Oracle)',
      periodo: { inicio: dataIni, fim: dataFim },
      cdLoja,
      registros,
    };
  }

  @Process('nf-detalhe')
  async handleNfDetalhe(job: Job) {
    const { data, cdLoja } = job.data;
    job.log(`Iniciando DB5 (Oracle MDLog) - Detalhe NF: ${data}, loja: ${cdLoja}`);
    await job.progress(10);
    const registros = await this.db5Client.nfDetalhe(data, cdLoja);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);
    return {
      database: 'DB5 - MDLog (Oracle)',
      data,
      cdLoja,
      registros,
    };
  }

  @Process('nf-total')
  async handleNfTotal(job: Job) {
    const { dataIni, dataFim } = job.data;
    job.log(`Iniciando DB5 (Oracle MDLog) - Total geral NF: ${dataIni} até ${dataFim}`);
    await job.progress(10);
    const registros = await this.db5Client.nfTotal(dataIni, dataFim);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} datas consolidadas`);
    return {
      database: 'DB5 - MDLog (Oracle)',
      periodo: { inicio: dataIni, fim: dataFim },
      tipo: 'total_geral',
      registros,
    };
  }
}

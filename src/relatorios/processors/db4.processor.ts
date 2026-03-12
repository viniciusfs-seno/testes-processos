import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db4Client } from '../db4.client';

@Processor('db4-relatorios')
export class Db4Processor {
  constructor(private readonly db4Client: Db4Client) {}

  @Process('vendas-resumo')
  async handleVendasResumo(job: Job) {
    const { dataIni, dataFim, cdLoja = 0 } = job.data;
    job.log(`Iniciando DB4 (MySQL) - Resumo: ${dataIni} até ${dataFim}, loja: ${cdLoja}`);
    await job.progress(10);
    const registros = await this.db4Client.vendasResumo(dataIni, dataFim, cdLoja);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);
    return {
      database: 'DB4 - Emporium Farmácias (MySQL)',
      periodo: { inicio: dataIni, fim: dataFim },
      cdLoja,
      registros,
    };
  }

  @Process('vendas-detalhe')
  async handleVendasDetalhe(job: Job) {
    const { data, cdLoja } = job.data;
    job.log(`Iniciando DB4 (MySQL) - Detalhe: ${data}, loja: ${cdLoja}`);
    await job.progress(10);
    const registros = await this.db4Client.vendasDetalhe(data, cdLoja);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} registros`);
    return {
      database: 'DB4 - Emporium Farmácias (MySQL)',
      data,
      cdLoja,
      registros,
    };
  }

  @Process('vendas-total')
  async handleVendasTotal(job: Job) {
    const { dataIni, dataFim } = job.data;
    job.log(`Iniciando DB4 (MySQL) - Total geral: ${dataIni} até ${dataFim}`);
    await job.progress(10);
    const registros = await this.db4Client.vendasTotal(dataIni, dataFim);
    await job.progress(100);
    job.log(`Concluído: ${registros.length} datas consolidadas`);
    return {
      database: 'DB4 - Emporium Farmácias (MySQL)',
      periodo: { inicio: dataIni, fim: dataFim },
      tipo: 'total_geral',
      registros,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Db1CnsdResumoDto } from './dto/db1-cnsd-resumo.dto';
import { Db2VendasResumoDto } from './dto/db2-vendas-resumo.dto';
import { Db3VendasResumoDto } from './dto/db3-vendas-resumo.dto';
import { Db4VendasResumoDto } from './dto/db4-vendas-resumo.dto';
import { Db4VendasDetalheDto } from './dto/db4-vendas-detalhe.dto';
import { Db4VendasTotalDto } from './dto/db4-vendas-total.dto';
import { Db5NfResumoDto } from './dto/db5-nf-resumo.dto';
import { Db5NfDetalheDto } from './dto/db5-nf-detalhe.dto';
import { Db5NfTotalDto } from './dto/db5-nf-total.dto';

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectQueue('db1-relatorios') private db1Queue: Queue,
    @InjectQueue('db2-relatorios') private db2Queue: Queue,
    @InjectQueue('db3-relatorios') private db3Queue: Queue,
    @InjectQueue('db4-relatorios') private db4Queue: Queue,
    @InjectQueue('db5-relatorios') private db5Queue: Queue,
  ) {}

  // ─── DB1 ────────────────────────────────────────────────────────────────────

  async resumoDb1Cnsd(dto: Db1CnsdResumoDto) {
    const job = await this.db1Queue.add('resumo-cnsd', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db1-relatorios', database: 'DB1',
      status: 'enfileirado', statusUrl: `/relatorios/job/db1-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db1-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB2 ────────────────────────────────────────────────────────────────────

  async resumoDb2Vendas(dto: Db2VendasResumoDto) {
    const job = await this.db2Queue.add('vendas-resumo', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db2-relatorios', database: 'DB2',
      status: 'enfileirado', statusUrl: `/relatorios/job/db2-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db2-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB3 ────────────────────────────────────────────────────────────────────

  async resumoDb3Vendas(dto: Db3VendasResumoDto) {
    const job = await this.db3Queue.add('vendas-resumo', dto, {
      attempts: 3, backoff: 5000, timeout: 600000,
    });
    return {
      jobId: job.id, queue: 'db3-relatorios', database: 'DB3',
      status: 'enfileirado', statusUrl: `/relatorios/job/db3-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db3-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB4 ────────────────────────────────────────────────────────────────────

  async resumoDb4Vendas(dto: Db4VendasResumoDto) {
    const job = await this.db4Queue.add('vendas-resumo', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      status: 'enfileirado', statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  async detalheDb4Vendas(dto: Db4VendasDetalheDto) {
    const job = await this.db4Queue.add('vendas-detalhe', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      status: 'enfileirado', statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  async totalDb4Vendas(dto: Db4VendasTotalDto) {
    const job = await this.db4Queue.add('vendas-total', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      tipo: 'total_geral',
      status: 'enfileirado', statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB5 ────────────────────────────────────────────────────────────────────

  async resumoDb5Nf(dto: Db5NfResumoDto) {
    const job = await this.db5Queue.add('nf-resumo', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db5-relatorios', database: 'DB5 - MDLog (Oracle)',
      status: 'enfileirado', statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  async detalheDb5Nf(dto: Db5NfDetalheDto) {
    const job = await this.db5Queue.add('nf-detalhe', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db5-relatorios', database: 'DB5 - MDLog (Oracle)',
      status: 'enfileirado', statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  async totalDb5Nf(dto: Db5NfTotalDto) {
    const job = await this.db5Queue.add('nf-total', dto, {
      attempts: 3, backoff: 5000, timeout: 300000,
    });
    return {
      jobId: job.id, queue: 'db5-relatorios', database: 'DB5 - MDLog (Oracle)',
      tipo: 'total_geral',
      status: 'enfileirado', statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private calcularDuracao(processedOn: number | undefined, finishedOn: number | undefined) {
    if (!processedOn || !finishedOn) return { duracaoMs: null, duracaoFormatada: null };
    const duracaoMs = finishedOn - processedOn;
    const segundosTotais = Math.floor(duracaoMs / 1000);
    const minutos = Math.floor(segundosTotais / 60);
    const segundos = segundosTotais % 60;
    return { duracaoMs, duracaoFormatada: `${minutos}min ${segundos}s` };
  }

  private get allQueues(): Record<string, Queue> {
    return {
      'db1-relatorios': this.db1Queue,
      'db2-relatorios': this.db2Queue,
      'db3-relatorios': this.db3Queue,
      'db4-relatorios': this.db4Queue,
      'db5-relatorios': this.db5Queue,
    };
  }

  private buildJobResponse(job: any, queueName: string, state: string, progress: any, logs: any) {
    const { duracaoMs, duracaoFormatada } = this.calcularDuracao(job.processedOn, job.finishedOn);
    return {
      jobId: job.id, queue: queueName,
      database: queueName.replace('-relatorios', '').toUpperCase(),
      status: state, progress, data: job.data,
      result: state === 'completed' ? job.returnvalue : null,
      logs: logs.logs, failedReason: job.failedReason,
      timestamp: job.timestamp, processedOn: job.processedOn,
      finishedOn: job.finishedOn, duracaoMs, duracaoFormatada,
    };
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  async getJobStatusByQueue(queueName: string, jobId: string) {
    const queues = this.allQueues;
    const queue = queues[queueName];
    if (!queue) {
      throw new NotFoundException(
        `Fila '${queueName}' não encontrada. Use: ${Object.keys(queues).join(', ')}`,
      );
    }
    const job = await queue.getJob(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} não encontrado na fila ${queueName}`);
    const state = await job.getState();
    const progress = job.progress();
    const logs = await queue.getJobLogs(jobId);
    return this.buildJobResponse(job, queueName, state, progress, logs);
  }

  async getJobStatus(jobId: string) {
    for (const [queueName, queue] of Object.entries(this.allQueues)) {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        const progress = job.progress();
        const logs = await queue.getJobLogs(jobId);
        return this.buildJobResponse(job, queueName, state, progress, logs);
      }
    }
    throw new NotFoundException(`Job ${jobId} não encontrado em nenhuma fila`);
  }
}

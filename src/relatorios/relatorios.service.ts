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
import { RelatorioSubidaVendasDto } from './dto/relatorio-subida-vendas.dto';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';

@Injectable()
export class RelatoriosService {
  private ultimoRelatorioSubida:
    | {
        criadoEm: string;
        dataIni: string;
        dataFim: string;
        jobs: Array<{
          nome: string;
          database: string;
          queue: string;
          jobId: string | number;
          statusUrl: string;
          payload: Record<string, any>;
        }>;
      }
    | null = null;

  constructor(
    @InjectQueue('db1-relatorios') private db1Queue: Queue,
    @InjectQueue('db2-relatorios') private db2Queue: Queue,
    @InjectQueue('db3-relatorios') private db3Queue: Queue,
    @InjectQueue('db4-relatorios') private db4Queue: Queue,
    @InjectQueue('db5-relatorios') private db5Queue: Queue,
  ) {}

  // Relatorio Subida de Vendas
  async relatorioSubidaVendas(dto: RelatorioSubidaVendasDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const payloadBase = { dataIni, dataFim };
    const payloadLoja = { dataIni, dataFim, cdLoja: 0 };

    const [
      db1,
      db2,
      db3Mercantil,
      db3Giga,
      db4,
      db5,
    ] = await Promise.all([
      this.resumoDb1Cnsd(payloadBase as Db1CnsdResumoDto),
      this.resumoDb2Vendas(payloadBase as Db2VendasResumoDto),
      this.resumoDb3VendasMercantil(payloadBase as Db3VendasResumoDto),
      this.resumoDb3VendasGiga(payloadBase as Db3VendasResumoDto),
      this.resumoDb4Vendas(payloadLoja as Db4VendasResumoDto),
      this.resumoDb5Nf(payloadLoja as Db5NfResumoDto),
    ]);

    const jobs = [
      {
        nome: 'Emporium lojas (bandeiras)',
        database: db1.database ?? 'DB1',
        queue: db1.queue,
        jobId: db1.jobId,
        statusUrl: db1.statusUrl,
        payload: payloadBase,
      },
      {
        nome: 'Emporium atacado (Mercantil)',
        database: db2.database ?? 'DB2',
        queue: db2.queue,
        jobId: db2.jobId,
        statusUrl: db2.statusUrl,
        payload: payloadBase,
      },
      {
        nome: 'Consinco (Mercantil)',
        database: db3Mercantil.database ?? 'DB3 - CONSINCO (MERCANTIL)',
        queue: db3Mercantil.queue,
        jobId: db3Mercantil.jobId,
        statusUrl: db3Mercantil.statusUrl,
        payload: payloadBase,
      },
      {
        nome: 'Consinco (Giga) por hora',
        database: db3Giga.database ?? 'DB3 - CONSINCO (GIGA)',
        queue: db3Giga.queue,
        jobId: db3Giga.jobId,
        statusUrl: db3Giga.statusUrl,
        payload: payloadBase,
      },
      {
        nome: 'Emporium farmacias',
        database: db4.database ?? 'DB4 - Emporium Farmacias (MySQL)',
        queue: db4.queue,
        jobId: db4.jobId,
        statusUrl: db4.statusUrl,
        payload: payloadLoja,
      },
      {
        nome: 'MDLog',
        database: db5.database ?? 'DB5 - MDLog (Oracle)',
        queue: db5.queue,
        jobId: db5.jobId,
        statusUrl: db5.statusUrl,
        payload: payloadLoja,
      },
    ];

    this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  async relatorioSubidaVendasGiga(dto: RelatorioSubidaVendasDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const payloadBase = { dataIni, dataFim };
    const db3Giga = await this.resumoDb3VendasGiga(payloadBase as Db3VendasResumoDto);

    const jobs = [
      {
        nome: 'Consinco (Giga) por hora',
        database: db3Giga.database ?? 'DB3 - CONSINCO (GIGA)',
        queue: db3Giga.queue,
        jobId: db3Giga.jobId,
        statusUrl: db3Giga.statusUrl,
        payload: payloadBase,
      },
    ];

    this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  getUltimoRelatorioSubidaVendas() {
    if (!this.ultimoRelatorioSubida) {
      return { encontrado: false };
    }

    return { encontrado: true, ...this.ultimoRelatorioSubida };
  }

  // ─── DB1 ────────────────────────────────────────────────────────────────────

  async resumoDb1Cnsd(dto: Db1CnsdResumoDto) {
    const job = await this.db1Queue.add('resumo-cnsd', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db1-relatorios',
      database: 'DB1',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db1-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db1-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB2 ────────────────────────────────────────────────────────────────────

  async resumoDb2Vendas(dto: Db2VendasResumoDto) {
    const job = await this.db2Queue.add('vendas-resumo', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db2-relatorios',
      database: 'DB2',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db2-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db2-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB3 ────────────────────────────────────────────────────────────────────

  private async adicionarJobDb3(dto: Db3VendasResumoDto, tipoEmpresa: TipoEmpresaDb3) {
    const job = await this.db3Queue.add(
      'vendas-resumo',
      {
        ...dto,
        tipoEmpresa,
      },
      {
        attempts: 3,
        backoff: 5000,
        timeout: 600000,
      },
    );

    return {
      jobId: job.id,
      queue: 'db3-relatorios',
      database: 'DB3 - CONSINCO',
      tipoEmpresa,
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db3-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db3-relatorios/${job.id} para consultar status`,
    };
  }

  async resumoDb3VendasMercantil(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'MERCANTIL');
  }

  async resumoDb3VendasGiga(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'GIGA');
  }

  // ─── DB4 ────────────────────────────────────────────────────────────────────

  async resumoDb4Vendas(dto: Db4VendasResumoDto) {
    const job = await this.db4Queue.add('vendas-resumo', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  async detalheDb4Vendas(dto: Db4VendasDetalheDto) {
    const job = await this.db4Queue.add('vendas-detalhe', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  async totalDb4Vendas(dto: Db4VendasTotalDto) {
    const job = await this.db4Queue.add('vendas-total', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db4-relatorios',
      database: 'DB4 - Emporium Farmácias (MySQL)',
      tipo: 'total_geral',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db4-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db4-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── DB5 ────────────────────────────────────────────────────────────────────

  async resumoDb5Nf(dto: Db5NfResumoDto) {
    const job = await this.db5Queue.add('nf-resumo', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db5-relatorios',
      database: 'DB5 - MDLog (Oracle)',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  async detalheDb5Nf(dto: Db5NfDetalheDto) {
    const job = await this.db5Queue.add('nf-detalhe', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db5-relatorios',
      database: 'DB5 - MDLog (Oracle)',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  async totalDb5Nf(dto: Db5NfTotalDto) {
    const job = await this.db5Queue.add('nf-total', dto, {
      attempts: 3,
      backoff: 5000,
      timeout: 300000,
    });

    return {
      jobId: job.id,
      queue: 'db5-relatorios',
      database: 'DB5 - MDLog (Oracle)',
      tipo: 'total_geral',
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db5-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db5-relatorios/${job.id} para consultar status`,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private getFortalezaDateParts() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    return { year: map.year, month: map.month, day: map.day };
  }

  private getFortalezaDateTime() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`;
  }

  private getTodayFortalezaIso() {
    const { year, month, day } = this.getFortalezaDateParts();
    return `${year}-${month}-${day}`;
  }

  private resolvePeriodo(dto?: { dataIni?: string; dataFim?: string }) {
    const today = this.getTodayFortalezaIso();
    const dataIni = dto?.dataIni ?? dto?.dataFim ?? today;
    const dataFim = dto?.dataFim ?? dto?.dataIni ?? today;
    return { dataIni, dataFim };
  }

  private registrarUltimoRelatorioSubida(
    dataIni: string,
    dataFim: string,
    jobs: Array<{
      nome: string;
      database: string;
      queue: string;
      jobId: string | number;
      statusUrl: string;
      payload: Record<string, any>;
    }>,
  ) {
    this.ultimoRelatorioSubida = {
      criadoEm: this.getFortalezaDateTime(),
      dataIni,
      dataFim,
      jobs,
    };
  }

  private calcularDuracao(processedOn: number | undefined, finishedOn: number | undefined) {
    if (!processedOn || !finishedOn) {
      return { duracaoMs: null, duracaoFormatada: null };
    }

    const duracaoMs = finishedOn - processedOn;
    const segundosTotais = Math.floor(duracaoMs / 1000);
    const minutos = Math.floor(segundosTotais / 60);
    const segundos = segundosTotais % 60;

    return {
      duracaoMs,
      duracaoFormatada: `${minutos}min ${segundos}s`,
    };
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

  private getDatabaseName(queueName: string, jobData?: any) {
    switch (queueName) {
      case 'db1-relatorios':
        return 'DB1';
      case 'db2-relatorios':
        return 'DB2';
      case 'db3-relatorios':
        return jobData?.tipoEmpresa
          ? `DB3 - CONSINCO (${jobData.tipoEmpresa})`
          : 'DB3 - CONSINCO';
      case 'db4-relatorios':
        return 'DB4 - Emporium Farmácias (MySQL)';
      case 'db5-relatorios':
        return 'DB5 - MDLog (Oracle)';
      default:
        return queueName.replace('-relatorios', '').toUpperCase();
    }
  }

  private buildJobResponse(
    job: any,
    queueName: string,
    state: string,
    progress: any,
    logs: { logs: string[] },
  ) {
    const { duracaoMs, duracaoFormatada } = this.calcularDuracao(
      job.processedOn,
      job.finishedOn,
    );

    return {
      jobId: job.id,
      queue: queueName,
      database: this.getDatabaseName(queueName, job.data),
      status: state,
      progress,
      data: job.data,
      result: state === 'completed' ? job.returnvalue : null,
      logs: logs.logs,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      duracaoMs,
      duracaoFormatada,
    };
  }

  // ─── Status ─────────────────────────────────────────────────────────────────

  async getJobStatusByQueue(queueName: string, jobId: string) {
    const queues = this.allQueues;
    const queue = queues[queueName];

    if (!queue) {
      throw new NotFoundException(
        `Fila '${queueName}' não encontrada. Use: ${Object.keys(queues).join(', ')}`,
      );
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} não encontrado na fila ${queueName}`);
    }

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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { dirname, join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
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
import { Db3Client } from './db3.client';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';
type TipoConsultaGigaDb3 = 'LIQUIDA' | 'BRUTA' | 'RDP_SIMILAR';
type UltimoRelatorioJob = {
  nome: string;
  database: string;
  queue: string;
  jobId: string | number;
  statusUrl: string;
  payload: Record<string, any>;
};

@Injectable()
export class RelatoriosService {
  private readonly ultimoRelatorioSubidaPath = join(
    process.cwd(),
    'data',
    'ultimo-relatorio-subida.json',
  );

  private ultimoRelatorioSubida:
    | {
        criadoEm: string;
        dataIni: string;
        dataFim: string;
        jobs: UltimoRelatorioJob[];
      }
    | null = null;
  private ultimoRelatorioSubidaCarregado = false;
  private carregandoUltimoRelatorioSubida: Promise<void> | null = null;

  constructor(
    @InjectQueue('db1-relatorios') private db1Queue: Queue,
    @InjectQueue('db2-relatorios') private db2Queue: Queue,
    @InjectQueue('db3-relatorios') private db3Queue: Queue,
    @InjectQueue('db4-relatorios') private db4Queue: Queue,
    @InjectQueue('db5-relatorios') private db5Queue: Queue,
    private readonly db3Client: Db3Client,
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

    await this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  async relatorioSubidaVendasGiga(dto: RelatorioSubidaVendasDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const payloadBase = { dataIni, dataFim };
    const db3Giga = await this.resumoDb3VendasGiga(payloadBase as Db3VendasResumoDto);

    const jobs = [
      {
        nome: 'Consinco (Giga) por hora - Liquida',
        database: db3Giga.database ?? 'DB3 - CONSINCO (GIGA)',
        queue: db3Giga.queue,
        jobId: db3Giga.jobId,
        statusUrl: db3Giga.statusUrl,
        payload: payloadBase,
      },
    ];

    await this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  async relatorioSubidaVendasGigaBruta(dto: RelatorioSubidaVendasDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const payloadBase = { dataIni, dataFim };
    const db3Giga = await this.resumoDb3VendasGigaBruta(payloadBase as Db3VendasResumoDto);

    const jobs = [
      {
        nome: 'Consinco (Giga) por hora - Bruta',
        database: db3Giga.database ?? 'DB3 - CONSINCO (GIGA)',
        queue: db3Giga.queue,
        jobId: db3Giga.jobId,
        statusUrl: db3Giga.statusUrl,
        payload: payloadBase,
      },
    ];

    await this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  async relatorioSubidaVendasGigaRdp(dto: RelatorioSubidaVendasDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const payloadBase = { dataIni, dataFim };
    const db3Giga = await this.resumoDb3VendasGigaRdp(payloadBase as Db3VendasResumoDto);

    const jobs = [
      {
        nome: 'Consinco (Giga) por hora - RDP similar',
        database: db3Giga.database ?? 'DB3 - CONSINCO (GIGA)',
        queue: db3Giga.queue,
        jobId: db3Giga.jobId,
        statusUrl: db3Giga.statusUrl,
        payload: payloadBase,
      },
    ];

    await this.registrarUltimoRelatorioSubida(dataIni, dataFim, jobs);

    return jobs;
  }

  async getUltimoRelatorioSubidaVendas() {
    await this.ensureUltimoRelatorioSubidaCarregado();

    if (!this.ultimoRelatorioSubida) {
      return { encontrado: false };
    }

    return { encontrado: true, ...this.ultimoRelatorioSubida };
  }

  async getRelatorioSubidaVendasFinalData() {
    await this.ensureUltimoRelatorioSubidaCarregado();

    if (!this.ultimoRelatorioSubida) {
      return {
        encontrado: false,
        pronto: false,
      };
    }

    const jobs = await Promise.all(
      this.ultimoRelatorioSubida.jobs.map(async (job) => {
        const status = await this.getJobStatusInterno(job.queue, String(job.jobId));
        return {
          ...job,
          status,
        };
      }),
    );

    const pronto = jobs.length > 0 && jobs.every((job) => job.status.status === 'completed');
    const secoes = jobs.map((job) => this.buildFinalSection(job));
    const gigaLiquida = secoes.find((secao) => secao.isGigaLiquida) ?? null;
    const secoesPrincipais = secoes.filter((secao) => !secao.isGigaLiquida);
    const comparativos = this.buildComparativos(secoes);
    const basesComDados = secoes.filter((secao) => secao.rows.length > 0).length;
    const registrosTotais = secoes.reduce((total, secao) => total + secao.rows.length, 0);
    const totalConsolidado = secoes.reduce((total, secao) => total + (secao.total ?? 0), 0);

    return {
      encontrado: true,
      pronto,
      criadoEm: this.ultimoRelatorioSubida.criadoEm,
      dataIni: this.ultimoRelatorioSubida.dataIni,
      dataFim: this.ultimoRelatorioSubida.dataFim,
      resumo: {
        totalJobs: jobs.length,
        jobsConcluidos: jobs.filter((job) => job.status.status === 'completed').length,
        jobsComFalha: jobs.filter((job) => job.status.status === 'failed').length,
        jobsPendentes: jobs.filter((job) => job.status.status !== 'completed').length,
        basesComDados,
        registrosTotais,
        totalConsolidado,
        totalGigaLiquida: gigaLiquida?.total ?? null,
        totalComparativos: comparativos.length,
      },
      comparativos,
      gigaLiquida: gigaLiquida
        ? {
            ...gigaLiquida,
            resumoFaixas: this.buildGigaResumo(gigaLiquida),
          }
        : null,
      secoes: [],
    };
  }

  async getGigaValidacaoData(dto?: Db3VendasResumoDto) {
    const { dataIni, dataFim } = this.resolvePeriodo(dto);
    const dataReferencia = dataIni;
    const segmentosPadrao = this.getSegmentosPadraoGiga();
    const tiposConsulta: TipoConsultaGigaDb3[] = ['LIQUIDA', 'BRUTA', 'RDP_SIMILAR'];
    const { horaInicioConsulta, horaFimConsulta, faixaFimLabel } =
      this.getFaixaHorariaConsulta(dataReferencia);

    const [lojasElegiveisRaw, segmentosUsadosRaw, segmentosPossiveisRaw, catalogoColunas] =
      await Promise.all([
        this.db3Client.listarEmpresasPorFaixa('GIGA'),
        this.db3Client.listarSegmentosDetalhados(segmentosPadrao),
        this.db3Client.listarTodosSegmentosPossiveis(),
        this.db3Client.listarCatalogoColunasGiga().catch(() => []),
      ]);

    const lojasElegiveis = lojasElegiveisRaw.map((loja: any) => ({
      codigo: Number(loja.CODIGO),
      nome: String(loja.NOME ?? loja.NOME_REDUZIDO ?? loja.CODIGO),
      nomeReduzido: loja.NOME_REDUZIDO ? String(loja.NOME_REDUZIDO) : null,
    }));

    const segmentosUsados = segmentosUsadosRaw.map((segmento: any) => ({
      codigo: Number(segmento.CODIGO),
      descricao: String(segmento.DESCRICAO ?? segmento.CODIGO),
      status: segmento.STATUS ? String(segmento.STATUS) : null,
    }));

    const segmentosPossiveis = segmentosPossiveisRaw.map((segmento: any) => ({
      codigo: Number(segmento.CODIGO),
      descricao: String(segmento.DESCRICAO ?? segmento.CODIGO),
      status: segmento.STATUS ? String(segmento.STATUS) : null,
    }));

    const criterios = await Promise.all(
      tiposConsulta.map(async (tipoConsulta) => {
        const [registrosRaw, lojasComVendaRaw, segmentosComVendaRaw] = await Promise.all([
          this.db3Client.consultarPorSegmentosPorHora(
            dataReferencia,
            horaInicioConsulta,
            horaFimConsulta,
            segmentosPadrao,
            'GIGA',
            tipoConsulta,
          ),
          this.db3Client.consultarGigaTotaisPorLoja(
            dataReferencia,
            horaInicioConsulta,
            horaFimConsulta,
            segmentosPadrao,
            tipoConsulta,
          ),
          this.db3Client.consultarGigaTotaisPorSegmento(
            dataReferencia,
            horaInicioConsulta,
            horaFimConsulta,
            segmentosPadrao,
            tipoConsulta,
          ),
        ]);

        const registros = this.buildRegistrosHoraGigaValidacao(
          dataReferencia,
          registrosRaw,
          horaInicioConsulta,
          horaFimConsulta,
        );

        const lojasComVenda = lojasComVendaRaw.map((loja: any) => ({
          codigo: Number(loja.CODIGO),
          nome: String(loja.NOME ?? loja.NOME_REDUZIDO ?? loja.CODIGO),
          nomeReduzido: loja.NOME_REDUZIDO ? String(loja.NOME_REDUZIDO) : null,
          totalVenda: Number(loja.VALOR ?? 0),
        }));

        const mapaLojasComVenda = new Map(lojasComVenda.map((loja: any) => [loja.codigo, loja]));
        const lojasSemVenda = lojasElegiveis
          .filter((loja) => !mapaLojasComVenda.has(loja.codigo))
          .map((loja) => ({ ...loja, totalVenda: 0 }));

        const segmentosComVenda = segmentosComVendaRaw.map((segmento: any) => ({
          codigo: Number(segmento.CODIGO),
          descricao: String(segmento.DESCRICAO ?? segmento.CODIGO),
          status: segmento.STATUS ? String(segmento.STATUS) : null,
          totalVenda: Number(segmento.VALOR ?? 0),
        }));

        const mapaSegmentosComVenda = new Map(
          segmentosComVenda.map((segmento: any) => [segmento.codigo, segmento]),
        );
        const segmentosSemVenda = segmentosUsados
          .filter((segmento) => !mapaSegmentosComVenda.has(segmento.codigo))
          .map((segmento) => ({ ...segmento, totalVenda: 0 }));

        return {
          tipoConsulta,
          criterioValor: this.getCriterioValorGiga(tipoConsulta),
          dataHoraVendaExpr: this.getDataHoraVendaExprGiga(tipoConsulta),
          filtros: {
            criterioEmpresas: 'lojas_padrao_rdp',
            segmentosAplicados: segmentosPadrao,
            faixaHoras: {
              inicio: `${this.pad(horaInicioConsulta)}:00`,
              fim: faixaFimLabel,
            },
          },
          faixaHoras: {
            inicio: `${this.pad(horaInicioConsulta)}:00`,
            fim: faixaFimLabel,
          },
          registros,
          totalPeriodo: registros.reduce((total, registro) => total + Number(registro.VALOR ?? 0), 0),
          lojasElegiveis,
          lojasComVenda,
          lojasSemVenda,
          segmentosElegiveis: segmentosUsados,
          segmentosComVenda,
          segmentosSemVenda,
        };
      }),
    );

    const segmentosComVendaEmAlgumCriterio = new Set<number>();
    criterios.forEach((criterio) => {
      criterio.segmentosComVenda.forEach((segmento: any) => {
        segmentosComVendaEmAlgumCriterio.add(segmento.codigo);
      });
    });

    return {
      periodo: { inicio: dataIni, fim: dataFim, referenciaConsulta: dataReferencia },
      observacoes:
        dataIni !== dataFim
          ? [
              `A validacao de GIGA usa dataIni (${dataIni}) como referencia principal de hora. dataFim recebido: ${dataFim}.`,
            ]
          : [],
      lojasPadraoRdp: lojasElegiveis,
      segmentosPadrao,
      segmentosPadraoRdp: segmentosUsados,
      segmentosPossiveis: segmentosPossiveis.map((segmento) => ({
        ...segmento,
        estaNoConjuntoPadrao: segmentosPadrao.includes(String(segmento.codigo)),
        teveVendaEmAlgumCriterio: segmentosComVendaEmAlgumCriterio.has(segmento.codigo),
      })),
      criterios,
      catalogoColunas: this.buildCatalogoColunasResumo(catalogoColunas as any[]),
      documentacaoResumo: {
        arquivoMarkdown: 'docs/giga-validacao.md',
        criterios: tiposConsulta.map((tipoConsulta) => ({
          tipoConsulta,
          criterioValor: this.getCriterioValorGiga(tipoConsulta),
          dataHoraVendaExpr: this.getDataHoraVendaExprGiga(tipoConsulta),
        })),
        lojasPadraoRdp: lojasElegiveis,
        segmentosPadraoRdp: segmentosUsados,
        tabelasInspecionadas: ['MAXV_ABCDISTRIBBASE', 'PDV_DOCTO', 'MAX_EMPRESA', 'VPALM_SEGMENTO'],
        filtrosRelevantes: [
          'K.QTDEMBALAGEM = 1',
          "DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')",
          'V.DTAHORLANCTO como base horaria principal de GIGA',
          'Sem JOIN em PDV_DOCTO na consulta principal de GIGA',
          'Sem filtro V.CHECKOUT > 0 na consulta principal de GIGA',
        ],
        achados: [
          '112 = G10-VENDA EXTERNA e 116 = G14-CAMPINAS VE existem e estao ativos em MAX_EMPRESA.',
          'O segmento 28 = VENDA EXTERNA existe em VPALM_SEGMENTO e e o segmento observado para G10/G14.',
          'O segmento 63 existe, mas corresponde a MA-VENDA EXT BA.',
          'Em 2026-04-16, os totais por loja e por segmento bateram exatamente com o RDP usando MAXV_ABCDISTRIBBASE com K.QTDEMBALAGEM = 1, DECODE(... ) IN (S, I) e V.DTAHORLANCTO.',
          'Em 2026-04-16, a loja 112 teve 327319,51 e a loja 116 teve 179776,65 no segmento 28.',
          'PDV_DOCTO e o filtro V.CHECKOUT > 0 eram a principal fonte de divergencia entre a API antiga e o RDP.',
        ],
      },
    };
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

  private async adicionarJobDb3(
    dto: Db3VendasResumoDto,
    tipoEmpresa: TipoEmpresaDb3,
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ) {
    const job = await this.db3Queue.add(
      'vendas-resumo',
      {
        ...dto,
        tipoEmpresa,
        ...(tipoEmpresa === 'GIGA' ? { tipoConsultaGiga } : {}),
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
      ...(tipoEmpresa === 'GIGA' ? { tipoConsultaGiga } : {}),
      status: 'enfileirado',
      statusUrl: `/relatorios/job/db3-relatorios/${job.id}`,
      message: `Use GET /relatorios/job/db3-relatorios/${job.id} para consultar status`,
    };
  }

  async resumoDb3VendasMercantil(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'MERCANTIL');
  }

  async resumoDb3VendasGiga(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'GIGA', 'LIQUIDA');
  }

  async resumoDb3VendasGigaBruta(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'GIGA', 'BRUTA');
  }

  async resumoDb3VendasGigaRdp(dto: Db3VendasResumoDto) {
    return this.adicionarJobDb3(dto, 'GIGA', 'RDP_SIMILAR');
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

  private getSegmentosPadraoGiga() {
    return ['1', '10', '24', '27', '28', '29', '63'];
  }

  private getHoraAtualFortaleza() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    return Number(map.hour);
  }

  private getFaixaHorariaConsulta(dataReferencia: string) {
    const hoje = this.getTodayFortalezaIso();

    if (dataReferencia < hoje) {
      return {
        horaInicioConsulta: 0,
        horaFimConsulta: 24,
        faixaFimLabel: '23:59',
      };
    }

    if (dataReferencia > hoje) {
      return {
        horaInicioConsulta: 0,
        horaFimConsulta: 0,
        faixaFimLabel: '00:00',
      };
    }

    const horaAtual = this.getHoraAtualFortaleza();
    const horaFimConsulta = Number.isNaN(horaAtual) ? 0 : Math.min(horaAtual, 24);

    return {
      horaInicioConsulta: 0,
      horaFimConsulta,
      faixaFimLabel: horaFimConsulta === 24 ? '23:59' : `${this.pad(horaFimConsulta)}:00`,
    };
  }

  private pad(valor: number) {
    return valor.toString().padStart(2, '0');
  }

  private formatDateBr(dataIso: string) {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private resolvePeriodo(dto?: { dataIni?: string; dataFim?: string }) {
    const today = this.getTodayFortalezaIso();
    const dataIni = dto?.dataIni ?? dto?.dataFim ?? today;
    const dataFim = dto?.dataFim ?? dto?.dataIni ?? today;
    return { dataIni, dataFim };
  }

  private async registrarUltimoRelatorioSubida(
    dataIni: string,
    dataFim: string,
    jobs: UltimoRelatorioJob[],
  ) {
    this.ultimoRelatorioSubida = {
      criadoEm: this.getFortalezaDateTime(),
      dataIni,
      dataFim,
      jobs,
    };
    this.ultimoRelatorioSubidaCarregado = true;
    await this.persistirUltimoRelatorioSubida();
  }

  private async ensureUltimoRelatorioSubidaCarregado() {
    if (this.ultimoRelatorioSubidaCarregado) {
      return;
    }

    if (!this.carregandoUltimoRelatorioSubida) {
      this.carregandoUltimoRelatorioSubida = this.carregarUltimoRelatorioSubidaDoDisco().finally(() => {
        this.ultimoRelatorioSubidaCarregado = true;
        this.carregandoUltimoRelatorioSubida = null;
      });
    }

    await this.carregandoUltimoRelatorioSubida;
  }

  private async carregarUltimoRelatorioSubidaDoDisco() {
    try {
      const fileContent = await readFile(this.ultimoRelatorioSubidaPath, 'utf8');
      const parsed = JSON.parse(fileContent);

      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.criadoEm === 'string' &&
        typeof parsed.dataIni === 'string' &&
        typeof parsed.dataFim === 'string' &&
        Array.isArray(parsed.jobs)
      ) {
        this.ultimoRelatorioSubida = parsed;
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async persistirUltimoRelatorioSubida() {
    if (!this.ultimoRelatorioSubida) {
      return;
    }

    await mkdir(dirname(this.ultimoRelatorioSubidaPath), { recursive: true });
    await writeFile(
      this.ultimoRelatorioSubidaPath,
      JSON.stringify(this.ultimoRelatorioSubida, null, 2),
      'utf8',
    );
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

  private getCriterioValorGiga(tipoConsultaGiga: TipoConsultaGigaDb3) {
    if (tipoConsultaGiga === 'BRUTA') {
      return 'vlritemsemdesc_menos_vlrdevolitemsemdesc' as const;
    }

    if (tipoConsultaGiga === 'RDP_SIMILAR') {
      return 'vlritem_aproximado_rdp' as const;
    }

    return 'vlritem_menos_vlrdevolitem' as const;
  }

  private getDataHoraVendaExprGiga(tipoConsultaGiga: TipoConsultaGigaDb3) {
    return 'V.DTAHORLANCTO';
  }

  private buildRegistrosHoraGigaValidacao(
    dataReferencia: string,
    resultados: any[],
    horaInicioConsulta: number,
    horaFimConsulta: number,
  ) {
    const consolidado = new Map<number, number>();
    (Array.isArray(resultados) ? resultados : []).forEach((row: any) => {
      const hora = Number(row.HORA);
      const valor = Number(row.VALOR ?? 0);
      if (!Number.isNaN(hora)) {
        consolidado.set(hora, (consolidado.get(hora) ?? 0) + (Number.isFinite(valor) ? valor : 0));
      }
    });

    const horasComVenda = Array.from(consolidado.keys()).sort((a, b) => a - b);
    const horaInicioFaixa =
      horasComVenda.length > 0 ? horasComVenda[0] : horaInicioConsulta;
    const horaFimFaixa = Math.max(horaInicioFaixa, horaFimConsulta);
    const dataBr = this.formatDateBr(dataReferencia);
    const registros: Array<{ DATA: string; HORA: string; VALOR: number }> = [];

    for (let h = horaInicioFaixa; h < horaFimFaixa; h++) {
      registros.push({
        DATA: dataBr,
        HORA: `${this.pad(h)}:00-${this.pad(h)}:59`,
        VALOR: consolidado.get(h) ?? 0,
      });
    }

    return registros;
  }

  private buildCatalogoColunasResumo(catalogoColunas: any[]) {
    const rows = Array.isArray(catalogoColunas) ? catalogoColunas : [];
    const normalize = (value: any) => String(value ?? '').toUpperCase();
    const filterFields = (patterns: string[]) =>
      rows.filter((row) =>
        patterns.some((pattern) => normalize(row.COLUMN_NAME).includes(pattern)),
      );

    return {
      tabelasInspecionadas: Array.from(
        new Set(rows.map((row) => String(row.TABLE_NAME ?? '')).filter(Boolean)),
      ),
      colunasValor: filterFields(['VLR', 'VALOR']),
      colunasDataHora: filterFields(['DATA', 'DTA', 'HORA']),
      colunasEmpresa: filterFields(['EMPRESA', 'LOJA']),
      colunasSegmento: filterFields(['SEGMENT']),
      colunasJoinFiltro: filterFields(['NRODOCTO', 'NUMERODF', 'CHECKOUT', 'CODGERALOPER', 'STATUS']),
      brutoLiquidoResumo: [
        {
          tipoConsulta: 'LIQUIDA',
          criterioValor: this.getCriterioValorGiga('LIQUIDA'),
          colunasPrincipais: ['VLRITEM', 'VLRDEVOLITEM'],
        },
        {
          tipoConsulta: 'BRUTA',
          criterioValor: this.getCriterioValorGiga('BRUTA'),
          colunasPrincipais: ['VLRITEMSEMDESC', 'VLRDEVOLITEMSEMDESC'],
        },
        {
          tipoConsulta: 'RDP_SIMILAR',
          criterioValor: this.getCriterioValorGiga('RDP_SIMILAR'),
          colunasPrincipais: ['VLRITEM', 'DTAHORLANCTO'],
        },
      ],
    };
  }

  private getPreferredNumericField(registros: any[]) {
    if (!Array.isArray(registros) || registros.length === 0) {
      return null;
    }

    const preferredFields = [
      'TOTALTICKET',
      'TOTALITENS',
      'TOTALFISCAL',
      'VALOR',
      'TOTAL',
      'VLRTOTAL',
      'VALOR_TOTAL',
    ];

    for (const field of preferredFields) {
      if (registros.some((item) => Number.isFinite(Number(item?.[field])))) {
        return field;
      }
    }

    const primeiroRegistro = registros[0];
    if (!primeiroRegistro || typeof primeiroRegistro !== 'object') {
      return null;
    }

    return (
      Object.keys(primeiroRegistro).find((field) =>
        registros.some((item) => Number.isFinite(Number(item?.[field]))),
      ) ?? null
    );
  }

  private getResultadoTotal(result: any) {
    if (Number.isFinite(Number(result?.totalDia))) {
      return Number(result.totalDia);
    }

    const registros = Array.isArray(result?.registros) ? result.registros : [];
    const numericField = this.getPreferredNumericField(registros);

    if (!numericField) {
      return null;
    }

    return registros.reduce((total, item) => {
      const value = Number(item?.[numericField]);
      return Number.isFinite(value) ? total + value : total;
    }, 0);
  }

  private buildFinalSection(job: UltimoRelatorioJob & { status: any }) {
    const result = job.status?.result ?? null;
    const rows = Array.isArray(result?.registros) ? result.registros : [];
    const columns =
      rows.length > 0 && typeof rows[0] === 'object' ? Object.keys(rows[0]).slice(0, 6) : [];
    const total = this.getResultadoTotal(result);
    const isGigaLiquida =
      job.status?.data?.tipoEmpresa === 'GIGA' && job.status?.data?.tipoConsultaGiga === 'LIQUIDA';

    return {
      id: `${job.queue}-${job.jobId}`,
      nome: job.nome,
      database: job.database,
      queue: job.queue,
      jobId: String(job.jobId),
      status: job.status?.status ?? 'waiting',
      failedReason: job.status?.failedReason ?? null,
      isGigaLiquida,
      criterioConsulta: result?.criterioConsulta ?? null,
      criterioValor: result?.criterioValor ?? null,
      faixaHoras: result?.faixaHoras ?? null,
      granularidade: result?.granularidade ?? null,
      metodo: result?.metodo ?? null,
      total,
      rows,
      columns,
    };
  }

  private normalizeReferenceDate(value: any) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof value === 'string') {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/');
        return `${year}-${month}-${day}`;
      }

      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
      }
    }

    return String(value ?? '');
  }

  private formatReferenceDate(value: any) {
    const normalized = this.normalizeReferenceDate(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const [year, month, day] = normalized.split('-');
      return `${day}/${month}/${year}`;
    }
    return normalized;
  }

  private getNumericValue(row: any, candidates: string[]) {
    for (const field of candidates) {
      const value = Number(row?.[field]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
    return 0;
  }

  private calcularPercentualDiferenca(
    diferenca: number | null | undefined,
    baseComparada: number | null | undefined,
  ) {
    const diff = Number(diferenca);
    const base = Number(baseComparada);

    if (!Number.isFinite(diff) || !Number.isFinite(base) || base === 0) {
      return null;
    }

    return (diff / base) * 100;
  }

  private buildComparativoTotais(rows: Array<Record<string, any>>, leftKey: string, rightKey?: string) {
    const totalLeft = rows.reduce((total, row) => total + Number(row[leftKey] ?? 0), 0);
    const totalRight = rightKey
      ? rows.reduce((total, row) => total + Number(row[rightKey] ?? 0), 0)
      : null;
    const diferencaTotal = rightKey ? totalLeft - Number(totalRight ?? 0) : null;
    const percentualDiferencaTotal = rightKey
      ? this.calcularPercentualDiferenca(diferencaTotal, totalRight)
      : null;

    return {
      totalLeft,
      totalRight,
      diferencaTotal,
      percentualDiferencaTotal,
    };
  }

  private buildManualSapComparativo(section: any) {
    const ordemBandeiras = [
      { origem: 'GBARBOSA', rotulo: 'BR GBarbosa' },
      { origem: 'BRETAS', rotulo: 'BR Bretas' },
      { origem: 'PREZUNIC', rotulo: 'BR Prezunic' },
      { origem: 'PERINI', rotulo: 'BR Perini' },
      { origem: 'SPID', rotulo: 'BR Spid' },
    ];

    const totaisPorBandeira = new Map<string, number>();
    (Array.isArray(section.rows) ? section.rows : []).forEach((row: any) => {
      const bandeira = String(row.BANDEIRA ?? '').toUpperCase();
      const valor = this.getNumericValue(row, ['TOTAL_EMPORIUM']);
      totaisPorBandeira.set(bandeira, (totaisPorBandeira.get(bandeira) ?? 0) + valor);
    });

    const rows = ordemBandeiras.map((item) => ({
      BANDEIRA: item.rotulo,
      EMPORIUM: totaisPorBandeira.get(item.origem) ?? 0,
      SAP: null,
      DIFERENCA: null,
      DIFERENCA_PERCENTUAL: null,
      rowKey: item.origem,
    }));

    const totals = this.buildComparativoTotais(rows, 'EMPORIUM');

    return {
      id: 'emporium-lojas-sap',
      titulo: 'Emporium lojas (bandeiras) x SAP',
      subtitulo:
        'Valores de SAP precisam ser preenchidos manualmente nesta primeira versao; a diferenca e recalculada na tela.',
      tipo: 'manual',
      leftLabel: 'Emporium Lojas',
      rightLabel: 'SAP',
      rows,
      ...totals,
    };
  }

  private buildAutomaticComparativo(
    leftSection: any,
    rightSection: any,
    config: {
      id: string;
      titulo: string;
      subtitulo: string;
      leftLabel: string;
      rightLabel: string;
      leftFields: string[];
      rightFields: string[];
    },
  ) {
    const map = new Map<string, Record<string, any>>();

    leftSection.rows.forEach((row: any) => {
      const reference = this.normalizeReferenceDate(row.DATA);
      const current = map.get(reference) ?? {
        REFERENCIA: this.formatReferenceDate(row.DATA),
        [config.leftLabel]: 0,
        [config.rightLabel]: 0,
      };

      current[config.leftLabel] =
        Number(current[config.leftLabel] ?? 0) + this.getNumericValue(row, config.leftFields);
      map.set(reference, current);
    });

    rightSection.rows.forEach((row: any) => {
      const reference = this.normalizeReferenceDate(row.DATA);
      const current = map.get(reference) ?? {
        REFERENCIA: this.formatReferenceDate(row.DATA),
        [config.leftLabel]: 0,
        [config.rightLabel]: 0,
      };

      current[config.rightLabel] =
        Number(current[config.rightLabel] ?? 0) + this.getNumericValue(row, config.rightFields);
      map.set(reference, current);
    });

    const rows = Array.from(map.values())
      .sort((a, b) => {
        const [dayA, monthA, yearA] = String(a.REFERENCIA).split('/').map(Number);
        const [dayB, monthB, yearB] = String(b.REFERENCIA).split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      })
      .map((row) => ({
        ...row,
        DIFERENCA: Number(row[config.leftLabel] ?? 0) - Number(row[config.rightLabel] ?? 0),
        DIFERENCA_PERCENTUAL: this.calcularPercentualDiferenca(
          Number(row[config.leftLabel] ?? 0) - Number(row[config.rightLabel] ?? 0),
          Number(row[config.rightLabel] ?? 0),
        ),
      }));

    const totals = this.buildComparativoTotais(rows, config.leftLabel, config.rightLabel);

    return {
      id: config.id,
      titulo: config.titulo,
      subtitulo: config.subtitulo,
      tipo: 'automatico',
      leftLabel: config.leftLabel,
      rightLabel: config.rightLabel,
      rows,
      ...totals,
    };
  }

  private buildComparativos(secoes: any[]) {
    const db1 = secoes.find((secao) => secao.queue === 'db1-relatorios');
    const db2 = secoes.find((secao) => secao.queue === 'db2-relatorios');
    const db3Mercantil = secoes.find(
      (secao) => secao.queue === 'db3-relatorios' && secao.nome === 'Consinco (Mercantil)',
    );
    const db4 = secoes.find((secao) => secao.queue === 'db4-relatorios');
    const db5 = secoes.find((secao) => secao.queue === 'db5-relatorios');

    const comparativos: any[] = [];

    if (db1) {
      comparativos.push(this.buildManualSapComparativo(db1));
    }

    if (db2 && db3Mercantil) {
      comparativos.push(
        this.buildAutomaticComparativo(db2, db3Mercantil, {
          id: 'emporium-atacado-consinco-mercantil',
          titulo: 'Emporium atacado (Mercantil) x Consinco (Mercantil)',
          subtitulo: 'Comparativo diario de vendas entre Emporium Atacado e Consinco Mercantil.',
          leftLabel: 'Emporium Atacado',
          rightLabel: 'Consinco Mercantil',
          leftFields: ['VALOR'],
          rightFields: ['VALOR'],
        }),
      );
    }

    if (db4 && db5) {
      comparativos.push(
        this.buildAutomaticComparativo(db4, db5, {
          id: 'emporium-farmacias-mdlog',
          titulo: 'Emporium farmacias x MDLOG',
          subtitulo: 'Comparativo diario de vendas entre o total de farmacias e o faturamento MDLOG.',
          leftLabel: 'Emporium Farmacias',
          rightLabel: 'MDLOG',
          leftFields: ['TOTALTICKET', 'TOTALFISCAL'],
          rightFields: ['VALOR_TOTAL'],
        }),
      );
    }

    return comparativos;
  }

  private buildGigaResumo(secao: any) {
    const rows = Array.isArray(secao?.rows) ? secao.rows : [];
    if (rows.length === 0) {
      return {
        faixaConsiderada: null,
        totalAtePenultimaFaixa: null,
        totalUltimaFaixa: null,
        totalAtualAposUltimaFaixa: null,
        aumentoValor: null,
        aumentoPercentual: null,
      };
    }

    const ultimaFaixa = rows[rows.length - 1];
    const totalUltimaFaixa = this.getNumericValue(ultimaFaixa, ['VALOR']);
    const totalAtePenultimaFaixa = rows
      .slice(0, -1)
      .reduce((total: number, row: any) => total + this.getNumericValue(row, ['VALOR']), 0);
    const totalAtualAposUltimaFaixa = totalAtePenultimaFaixa + totalUltimaFaixa;

    return {
      faixaConsiderada: secao?.faixaHoras ?? null,
      totalAtePenultimaFaixa: rows.length > 1 ? totalAtePenultimaFaixa : null,
      totalUltimaFaixa,
      totalAtualAposUltimaFaixa,
      aumentoValor: rows.length > 1 ? totalAtualAposUltimaFaixa - totalAtePenultimaFaixa : null,
      aumentoPercentual:
        rows.length > 1
          ? this.calcularPercentualDiferenca(totalUltimaFaixa, totalAtePenultimaFaixa)
          : null,
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

  private async getJobStatusInterno(queueName: string, jobId: string) {
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

  async getJobStatusByQueue(queueName: string, jobId: string) {
    return this.getJobStatusInterno(queueName, jobId);
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

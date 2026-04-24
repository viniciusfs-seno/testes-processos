import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import { RelatoriosService } from './relatorios.service';
import { Db3Client } from './db3.client';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let sequence: number;
  const jobsById = new Map<string, any>();
  const persistedReportPath = join(process.cwd(), 'data', 'ultimo-relatorio-subida.json');

  const add = jest.fn();
  const getJob = jest.fn();
  const getJobLogs = jest.fn();
  let db3ClientMock: jest.Mocked<
    Pick<
      Db3Client,
      | 'listarEmpresasPorFaixa'
      | 'listarSegmentosDetalhados'
      | 'listarTodosSegmentosPossiveis'
      | 'listarCatalogoColunasGiga'
      | 'consultarPorSegmentosPorHora'
      | 'consultarGigaTotaisPorLoja'
      | 'consultarGigaTotaisPorSegmento'
    >
  >;

  beforeEach(async () => {
    sequence = 0;
    jobsById.clear();
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    await rm(persistedReportPath, { force: true });

    add.mockReset().mockImplementation(async (name: string, payload: any) => {
      sequence += 1;
      const id = `job-${sequence}`;

      jobsById.set(id, {
        id,
        data: payload,
        returnvalue: null,
        failedReason: null,
        timestamp: 1713252000000 + sequence,
        processedOn: 1713252001000 + sequence,
        finishedOn: 1713252002000 + sequence,
        getState: jest.fn().mockResolvedValue('completed'),
        progress: jest.fn().mockReturnValue(100),
      });

      return { id, name };
    });

    getJob.mockReset().mockImplementation(async (id: string) => jobsById.get(String(id)) ?? null);
    getJobLogs.mockReset().mockResolvedValue({ logs: ['ok'] });
    db3ClientMock = {
      listarEmpresasPorFaixa: jest.fn().mockResolvedValue([
        { CODIGO: 101, NOME: 'GIGA LIMAO', NOME_REDUZIDO: 'G01-LIMAO' },
        { CODIGO: 112, NOME: 'GIGA VENDA EXTERNA', NOME_REDUZIDO: 'G10-VENDA EXTERNA' },
        { CODIGO: 116, NOME: 'GIGA CAMPINAS VENDA EXTERNA', NOME_REDUZIDO: 'G14-CAMPINAS VE' },
      ]),
      listarSegmentosDetalhados: jest.fn().mockResolvedValue([
        { CODIGO: 1, DESCRICAO: 'ATACADO', STATUS: 'A' },
        { CODIGO: 10, DESCRICAO: 'TELEVENDAS', STATUS: 'A' },
        { CODIGO: 24, DESCRICAO: 'RAPPI', STATUS: 'A' },
        { CODIGO: 27, DESCRICAO: 'IFOOD B2C', STATUS: 'A' },
        { CODIGO: 28, DESCRICAO: 'VENDA EXTERNA', STATUS: 'A' },
        { CODIGO: 29, DESCRICAO: 'GIGA-E-COMMERCE', STATUS: 'A' },
        { CODIGO: 63, DESCRICAO: 'MA-VENDA EXT BA', STATUS: 'A' },
      ]),
      listarTodosSegmentosPossiveis: jest.fn().mockResolvedValue([
        { CODIGO: 1, DESCRICAO: 'ATACADO', STATUS: 'A' },
        { CODIGO: 28, DESCRICAO: 'VENDA EXTERNA', STATUS: 'A' },
        { CODIGO: 63, DESCRICAO: 'MA-VENDA EXT BA', STATUS: 'A' },
        { CODIGO: 99, DESCRICAO: 'SEGMENTO TESTE', STATUS: 'I' },
      ]),
      listarCatalogoColunasGiga: jest.fn().mockResolvedValue([
        { TABLE_NAME: 'MAXV_ABCDISTRIBBASE', COLUMN_NAME: 'VLRITEM', DATA_TYPE: 'NUMBER' },
        { TABLE_NAME: 'MAXV_ABCDISTRIBBASE', COLUMN_NAME: 'VLRITEMSEMDESC', DATA_TYPE: 'NUMBER' },
        { TABLE_NAME: 'MAXV_ABCDISTRIBBASE', COLUMN_NAME: 'DTAHORLANCTO', DATA_TYPE: 'DATE' },
        { TABLE_NAME: 'MAXV_ABCDISTRIBBASE', COLUMN_NAME: 'NROSEGMENTO', DATA_TYPE: 'NUMBER' },
      ]),
      consultarPorSegmentosPorHora: jest.fn().mockResolvedValue([{ HORA: '6', VALOR: 15 }]),
      consultarGigaTotaisPorLoja: jest.fn().mockResolvedValue([
        { CODIGO: 112, NOME: 'GIGA VENDA EXTERNA', NOME_REDUZIDO: 'G10-VENDA EXTERNA', VALOR: 15 },
      ]),
      consultarGigaTotaisPorSegmento: jest.fn().mockResolvedValue([
        { CODIGO: 28, DESCRICAO: 'VENDA EXTERNA', STATUS: 'A', VALOR: 15 },
      ]),
    };

    const queueMock = { add, getJob, getJobLogs };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: getQueueToken('db1-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db2-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db3-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db4-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db5-relatorios'), useValue: queueMock },
        { provide: Db3Client, useValue: db3ClientMock },
      ],
    }).compile();

    service = module.get<RelatoriosService>(RelatoriosService);
  });

  afterEach(async () => {
    await rm(persistedReportPath, { force: true });
  });

  it('deve enfileirar giga liquida no endpoint atual', async () => {
    await service.resumoDb3VendasGiga({
      dataIni: '2026-04-16',
      dataFim: '2026-04-16',
    });

    expect(add).toHaveBeenCalledWith(
      'vendas-resumo',
      expect.objectContaining({
        tipoEmpresa: 'GIGA',
        tipoConsultaGiga: 'LIQUIDA',
      }),
      expect.any(Object),
    );
  });

  it('deve enfileirar giga bruta no novo fluxo', async () => {
    await service.resumoDb3VendasGigaBruta({
      dataIni: '2026-04-16',
      dataFim: '2026-04-16',
    });

    expect(add).toHaveBeenCalledWith(
      'vendas-resumo',
      expect.objectContaining({
        tipoEmpresa: 'GIGA',
        tipoConsultaGiga: 'BRUTA',
      }),
      expect.any(Object),
    );
  });

  it('deve enfileirar giga rdp similar no novo fluxo', async () => {
    await service.resumoDb3VendasGigaRdp({
      dataIni: '2026-04-16',
      dataFim: '2026-04-16',
    });

    expect(add).toHaveBeenCalledWith(
      'vendas-resumo',
      expect.objectContaining({
        tipoEmpresa: 'GIGA',
        tipoConsultaGiga: 'RDP_SIMILAR',
      }),
      expect.any(Object),
    );
  });

  it('retorna estado vazio para o relatorio final quando nao ha ultimo relatorio', async () => {
    await expect(service.getRelatorioSubidaVendasFinalData()).resolves.toEqual({
      encontrado: false,
      pronto: false,
    });
  });

  it('monta o payload do relatorio final com destaque para giga liquida', async () => {
    await service.relatorioSubidaVendas({
      dataIni: '2026-04-16',
      dataFim: '2026-04-16',
    });

    jobsById.get('job-1').returnvalue = {
      registros: [
        { DATA: '16/04/2026', BANDEIRA: 'GBARBOSA', TOTAL_EMPORIUM: 12 },
        { DATA: '16/04/2026', BANDEIRA: 'BRETAS', TOTAL_EMPORIUM: 22 },
      ],
      metodo: 'fila_sequencial',
    };

    jobsById.get('job-2').returnvalue = {
      registros: [{ DATA: '16/04/2026', VALOR: 22 }],
      metodo: 'fila_sequencial',
    };

    jobsById.get('job-3').returnvalue = {
      registros: [{ DATA: '16/04/2026', VALOR: 32 }],
      metodo: 'fila_sequencial',
    };

    jobsById.get('job-4').returnvalue = {
      criterioConsulta: 'LIQUIDA',
      criterioValor: 'vlritem_menos_vlrdevolitem',
      faixaHoras: { inicio: '05:00', fim: '09:00' },
      granularidade: 'HORA',
      metodo: 'consulta_unica',
      totalDia: 120,
      registros: [
        { DATA: '16/04/2026', HORA: '05:00-05:59', VALOR: 40 },
        { DATA: '16/04/2026', HORA: '06:00-06:59', VALOR: 80 },
      ],
    };

    jobsById.get('job-5').returnvalue = {
      registros: [
        { DATA: '16/04/2026', LOJA: 1, TOTALTICKET: 20 },
        { DATA: '16/04/2026', LOJA: 2, TOTALTICKET: 32 },
      ],
      metodo: 'fila_sequencial',
    };

    jobsById.get('job-6').returnvalue = {
      registros: [
        { DATA: '16/04/2026', LOJA: 101, VALOR_TOTAL: 40 },
        { DATA: '16/04/2026', LOJA: 102, VALOR_TOTAL: 22 },
      ],
      metodo: 'fila_sequencial',
    };

    const result = await service.getRelatorioSubidaVendasFinalData();

    expect(result.encontrado).toBe(true);
    expect(result.pronto).toBe(true);
    expect(result.resumo.totalJobs).toBe(6);
    expect(result.resumo.jobsConcluidos).toBe(6);
    expect(result.resumo.totalComparativos).toBe(3);
    expect(result.resumo.totalGigaLiquida).toBe(120);
    expect(result.comparativos).toHaveLength(3);
    expect(result.comparativos[0]).toEqual(
      expect.objectContaining({
        id: 'emporium-lojas-sap',
        tipo: 'manual',
        leftLabel: 'Emporium Lojas',
        rightLabel: 'SAP',
      }),
    );
    expect(result.comparativos[0].rows).toHaveLength(5);
    expect(result.comparativos[0].rows[0]).toEqual(
      expect.objectContaining({
        BANDEIRA: 'BR GBarbosa',
        EMPORIUM: 12,
        DIFERENCA_PERCENTUAL: null,
      }),
    );
    expect(result.comparativos[1]).toEqual(
      expect.objectContaining({
        id: 'emporium-atacado-consinco-mercantil',
        tipo: 'automatico',
        diferencaTotal: -10,
        percentualDiferencaTotal: expect.any(Number),
      }),
    );
    expect(result.comparativos[2]).toEqual(
      expect.objectContaining({
        id: 'emporium-farmacias-mdlog',
        tipo: 'automatico',
        diferencaTotal: -10,
        percentualDiferencaTotal: expect.any(Number),
      }),
    );
    expect(result.comparativos[2].rows[0]).toEqual(
      expect.objectContaining({
        REFERENCIA: '16/04/2026',
        'Emporium Farmacias': 52,
        MDLOG: 62,
      }),
    );
    expect(result.gigaLiquida).toEqual(
      expect.objectContaining({
        nome: 'Consinco (Giga) por hora',
        isGigaLiquida: true,
        criterioConsulta: 'LIQUIDA',
        total: 120,
        resumoFaixas: expect.objectContaining({
          faixaConsiderada: { inicio: '05:00', fim: '09:00' },
          totalAtePenultimaFaixa: 40,
          totalUltimaFaixa: 80,
          totalAtualAposUltimaFaixa: 120,
          aumentoValor: 80,
          aumentoPercentual: 200,
        }),
      }),
    );
    expect(result.secoes).toEqual([]);
  });

  it('recupera o ultimo relatorio salvo apos reiniciar o service', async () => {
    await service.relatorioSubidaVendas({
      dataIni: '2026-04-16',
      dataFim: '2026-04-16',
    });

    const queueMock = { add, getJob, getJobLogs };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: getQueueToken('db1-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db2-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db3-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db4-relatorios'), useValue: queueMock },
        { provide: getQueueToken('db5-relatorios'), useValue: queueMock },
        { provide: Db3Client, useValue: db3ClientMock },
      ],
    }).compile();

    const restartedService = module.get<RelatoriosService>(RelatoriosService);
    const ultimo = await restartedService.getUltimoRelatorioSubidaVendas();

    expect(ultimo).toEqual(
      expect.objectContaining({
        encontrado: true,
        dataIni: '2026-04-16',
        dataFim: '2026-04-16',
      }),
    );
    expect(ultimo.jobs).toHaveLength(6);
  });

  it('monta payload de validacao de giga com segmentos possiveis e faixas no padrao rdp', async () => {
    jest.spyOn(service as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-17');
    jest.spyOn(service as any, 'getHoraAtualFortaleza').mockReturnValue(8);

    const result = await service.getGigaValidacaoData({
      dataIni: '2026-04-17',
      dataFim: '2026-04-17',
    });

    expect(result.lojasPadraoRdp).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: 112 }),
        expect.objectContaining({ codigo: 116 }),
      ]),
    );
    expect(result.segmentosPadrao).toEqual(['1', '10', '24', '27', '28', '29', '63']);
    expect(result.segmentosPadraoRdp).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: 28, descricao: 'VENDA EXTERNA' }),
        expect.objectContaining({ codigo: 63, descricao: 'MA-VENDA EXT BA' }),
      ]),
    );
    expect(result.segmentosPossiveis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          codigo: 99,
          estaNoConjuntoPadrao: false,
          teveVendaEmAlgumCriterio: false,
        }),
      ]),
    );
    expect(result.criterios).toHaveLength(3);
    expect(result.criterios[0].registros[0]).toEqual(
      expect.objectContaining({
        DATA: '17/04/2026',
        HORA: '06:00-06:59',
        VALOR: 15,
      }),
    );
    expect(result.criterios[0].lojasSemVenda).toEqual(
      expect.arrayContaining([expect.objectContaining({ codigo: 101 }), expect.objectContaining({ codigo: 116 })]),
    );
    expect(result.criterios[0].filtros.criterioEmpresas).toBe('lojas_padrao_rdp');
    expect(result.criterios[0].dataHoraVendaExpr).toBe('V.DTAHORLANCTO');
    expect(result.catalogoColunas.colunasValor).toEqual(
      expect.arrayContaining([expect.objectContaining({ COLUMN_NAME: 'VLRITEM' })]),
    );
    expect(result.documentacaoResumo.filtrosRelevantes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('K.QTDEMBALAGEM = 1'),
        expect.stringContaining("DECODE(V.TIPTABELA"),
        expect.stringContaining('V.DTAHORLANCTO'),
        expect.stringContaining('Sem JOIN em PDV_DOCTO'),
        expect.stringContaining('Sem filtro V.CHECKOUT > 0'),
      ]),
    );
    expect(result.documentacaoResumo.achados).toEqual(
      expect.arrayContaining([
        expect.stringContaining('112 = G10-VENDA EXTERNA'),
        expect.stringContaining('segmento 28 = VENDA EXTERNA'),
        expect.stringContaining('bateram exatamente com o RDP'),
        expect.stringContaining('PDV_DOCTO e o filtro V.CHECKOUT > 0'),
      ]),
    );
    expect(result.documentacaoResumo.arquivoMarkdown).toBe('docs/giga-validacao.md');
  });
});

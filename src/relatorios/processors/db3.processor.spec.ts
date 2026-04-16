import { Db3Client } from '../db3.client';
import { Db3Processor } from './db3.processor';

type MockJob = {
  data: {
    dataIni: string;
    dataFim: string;
    segmentos?: string;
    tipoEmpresa: 'MERCANTIL' | 'GIGA';
  };
  log: jest.Mock;
  progress: jest.Mock<Promise<void>, [number]>;
};

describe('Db3Processor', () => {
  let processor: Db3Processor;
  let db3Client: jest.Mocked<
    Pick<
      Db3Client,
      | 'consultarPorSegmento'
      | 'consultarPorSegmentoPorHora'
      | 'consultarPorSegmentosPorHora'
      | 'listarEmpresasPorFaixa'
      | 'listarSegmentosDetalhados'
    >
  >;

  beforeEach(() => {
    db3Client = {
      consultarPorSegmento: jest.fn(),
      consultarPorSegmentoPorHora: jest.fn(),
      consultarPorSegmentosPorHora: jest.fn(),
      listarEmpresasPorFaixa: jest.fn().mockResolvedValue([
        { CODIGO: 101, NOME: 'GIGA LIMAO', NOME_REDUZIDO: 'G01-LIMAO' },
      ]),
      listarSegmentosDetalhados: jest.fn().mockResolvedValue([
        { CODIGO: 51, DESCRICAO: 'MA-ATACADO BA', STATUS: 'A' },
      ]),
    };

    processor = new Db3Processor(db3Client as unknown as Db3Client);
  });

  function createJob(data: MockJob['data']): MockJob {
    return {
      data,
      log: jest.fn(),
      progress: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('retorna faixas a partir da primeira hora com venda para dia anterior ate 23:59', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([
      { HORA: '05', VALOR: 7 },
      { HORA: '08', VALOR: 30 },
    ]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
    );
    expect(result.granularidade).toBe('HORA');
    expect(result.registros).toHaveLength(19);
    expect(result.registros[0]).toEqual({
      DATA: '05/04/2026',
      HORA: '05:00-06:00',
      VALOR: 7,
    });
    expect(result.registros[1]).toEqual({
      DATA: '05/04/2026',
      HORA: '06:00-07:00',
      VALOR: 0,
    });
    expect(result.registros[18]).toEqual({
      DATA: '05/04/2026',
      HORA: '23:00-23:59',
      VALOR: 0,
    });
    expect(result.totalDia).toBe(37);
    expect(result.criterioEmpresas).toBe('cadastro_giga_ativo');
    expect(result.criterioValor).toBe('vlritemsemdesc_menos_vlrdevolitemsemdesc');
    expect(result.lojas).toEqual([
      { codigo: 101, nome: 'GIGA LIMAO', nomeReduzido: 'G01-LIMAO' },
    ]);
    expect(result.segmentosDetalhados).toEqual([
      { codigo: 51, descricao: 'MA-ATACADO BA', status: 'A' },
    ]);
  });

  it('retorna a ultima faixa aberta para o dia atual', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(9);
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([
      { HORA: '05', VALOR: 4 },
      { HORA: '09', VALOR: 20 },
    ]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-06',
      0,
      10,
      ['51'],
      'GIGA',
    );
    expect(result.registros.map((registro) => registro.HORA)).toEqual([
      '05:00-06:00',
      '06:00-07:00',
      '07:00-08:00',
      '08:00-09:00',
      '09:00-10:00',
    ]);
    expect(result.registros.map((registro) => registro.VALOR)).toEqual([4, 0, 0, 0, 20]);
    expect(result.totalDia).toBe(24);
    expect(result.criterioEmpresas).toBe('cadastro_giga_ativo');
    expect(result.criterioValor).toBe('vlritemsemdesc_menos_vlrdevolitemsemdesc');
  });

  it('mantem faixas zeradas quando a consulta horaria retorna total zero', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(9);
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(result.registros).toEqual([]);
    expect(result.totalDia).toBe(0);
    expect(result.criterioEmpresas).toBe('cadastro_giga_ativo');
    expect(result.criterioValor).toBe('vlritemsemdesc_menos_vlrdevolitemsemdesc');
    expect(job.log).toHaveBeenCalledWith('Nenhuma venda encontrada no intervalo consultado.');
  });

  it('usa apenas dataIni e registra aviso quando dataFim for diferente', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
    );
    expect(job.log).toHaveBeenCalledWith(
      'Aviso: consulta por hora usa apenas dataIni (2026-04-05). dataFim recebido: 2026-04-06',
    );
  });

  it('retorna vazio quando ainda nao existe venda no dia atual', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(9);
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-06',
      0,
      10,
      ['51'],
      'GIGA',
    );
    expect(result.granularidade).toBe('HORA');
    expect(result.registros).toEqual([]);
    expect(result.totalDia).toBe(0);
    expect(result.criterioEmpresas).toBe('cadastro_giga_ativo');
    expect(result.criterioValor).toBe('vlritemsemdesc_menos_vlrdevolitemsemdesc');
  });
});

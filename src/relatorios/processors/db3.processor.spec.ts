import { Db3Client } from '../db3.client';
import { Db3Processor } from './db3.processor';

type MockJob = {
  data: {
    dataIni: string;
    dataFim: string;
    segmentos?: string;
    tipoEmpresa: 'MERCANTIL' | 'GIGA';
    tipoConsultaGiga?: 'LIQUIDA' | 'BRUTA' | 'RDP_SIMILAR';
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
        { CODIGO: 112, NOME: 'GIGA VENDA EXTERNA', NOME_REDUZIDO: 'G10-VENDA EXTERNA' },
        { CODIGO: 116, NOME: 'GIGA CAMPINAS VENDA EXTERNA', NOME_REDUZIDO: 'G14-CAMPINAS VE' },
      ]),
      listarSegmentosDetalhados: jest.fn().mockResolvedValue([
        { CODIGO: 28, DESCRICAO: 'VENDA EXTERNA', STATUS: 'A' },
        { CODIGO: 63, DESCRICAO: 'MA-VENDA EXT BA', STATUS: 'A' },
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
      tipoConsultaGiga: 'LIQUIDA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
      'LIQUIDA',
    );
    expect(result.granularidade).toBe('HORA');
    expect(result.registros).toHaveLength(19);
    expect(result.registros[0]).toEqual({
      DATA: '05/04/2026',
      HORA: '05:00-05:59',
      VALOR: 7,
    });
    expect(result.registros[18]).toEqual({
      DATA: '05/04/2026',
      HORA: '23:00-23:59',
      VALOR: 0,
    });
    expect(result.totalDia).toBe(37);
    expect(result.criterioConsulta).toBe('LIQUIDA');
    expect(result.criterioEmpresas).toBe('lojas_padrao_rdp');
    expect(result.criterioValor).toBe('vlritem_menos_vlrdevolitem');
  });

  it('retorna apenas horas fechadas para o dia atual', async () => {
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
      tipoConsultaGiga: 'LIQUIDA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-06',
      0,
      9,
      ['51'],
      'GIGA',
      'LIQUIDA',
    );
    expect(result.registros.map((registro) => registro.HORA)).toEqual([
      '05:00-05:59',
      '06:00-06:59',
      '07:00-07:59',
      '08:00-08:59',
    ]);
    expect(result.registros.map((registro) => registro.VALOR)).toEqual([4, 0, 0, 0]);
    expect(result.totalDia).toBe(4);
    expect(result.criterioConsulta).toBe('LIQUIDA');
  });

  it('retorna criterio de consulta bruta quando solicitado', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([
      { HORA: '07', VALOR: 72.5 },
    ]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
      tipoConsultaGiga: 'BRUTA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
      'BRUTA',
    );
    expect(result.criterioConsulta).toBe('BRUTA');
    expect(result.criterioValor).toBe('vlritemsemdesc_menos_vlrdevolitemsemdesc');
  });

  it('retorna criterio rdp similar quando solicitado', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([
      { HORA: '05', VALOR: 471.39 },
      { HORA: '06', VALOR: 11892.31 },
      { HORA: '07', VALOR: 82086.07 },
      { HORA: '08', VALOR: 127048.17 },
      { HORA: '09', VALOR: 195668.24 },
    ]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
      tipoConsultaGiga: 'RDP_SIMILAR',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
      'RDP_SIMILAR',
    );
    expect(result.criterioConsulta).toBe('RDP_SIMILAR');
    expect(result.criterioValor).toBe('vlritem_aproximado_rdp');
    expect(result.totalDia).toBeCloseTo(417166.18, 2);
    expect(result.registros.map((registro) => registro.HORA)).toEqual([
      '05:00-05:59',
      '06:00-06:59',
      '07:00-07:59',
      '08:00-08:59',
      '09:00-09:59',
      '10:00-10:59',
      '11:00-11:59',
      '12:00-12:59',
      '13:00-13:59',
      '14:00-14:59',
      '15:00-15:59',
      '16:00-16:59',
      '17:00-17:59',
      '18:00-18:59',
      '19:00-19:59',
      '20:00-20:59',
      '21:00-21:59',
      '22:00-22:59',
      '23:00-23:59',
    ]);
  });

  it('retorna vazio quando nao encontra vendas no intervalo consultado', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(9);
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
      tipoConsultaGiga: 'LIQUIDA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(result.registros).toEqual([]);
    expect(result.totalDia).toBe(0);
    expect(result.criterioConsulta).toBe('LIQUIDA');
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
      tipoConsultaGiga: 'LIQUIDA',
    });

    await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['51'],
      'GIGA',
      'LIQUIDA',
    );
    expect(job.log).toHaveBeenCalledWith(
      'Aviso: consulta por hora usa apenas dataIni (2026-04-05). dataFim recebido: 2026-04-06',
    );
  });

  it('usa os segmentos padrao de GIGA com 28 e 63 quando o job nao informa segmentos', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentosPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      tipoEmpresa: 'GIGA',
      tipoConsultaGiga: 'LIQUIDA',
    });

    await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentosPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      0,
      24,
      ['1', '10', '24', '27', '28', '29', '63'],
      'GIGA',
      'LIQUIDA',
    );
  });

  it('mantem o conjunto padrao antigo para mercantil quando o job nao informa segmentos', async () => {
    db3Client.consultarPorSegmento.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      tipoEmpresa: 'MERCANTIL',
    });

    await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmento).toHaveBeenNthCalledWith(
      1,
      '2026-04-05',
      '2026-04-05',
      '51',
      'MERCANTIL',
    );
    expect(db3Client.consultarPorSegmento).toHaveBeenLastCalledWith(
      '2026-04-05',
      '2026-04-05',
      '24',
      'MERCANTIL',
    );
    expect(db3Client.consultarPorSegmento).toHaveBeenCalledTimes(16);
  });
});

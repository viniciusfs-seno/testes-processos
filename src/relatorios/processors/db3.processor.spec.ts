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
  let db3Client: jest.Mocked<Pick<Db3Client, 'consultarPorSegmento' | 'consultarPorSegmentoPorHora'>>;

  beforeEach(() => {
    db3Client = {
      consultarPorSegmento: jest.fn(),
      consultarPorSegmentoPorHora: jest.fn(),
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

  it('retorna todas as faixas horarias para dia anterior ate 23:59', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentoPorHora.mockResolvedValue([
      { HORA: '06', VALOR: 10 },
      { HORA: '08', VALOR: 30 },
    ]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-05',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentoPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      6,
      24,
      '51',
      'GIGA',
    );
    expect(result.granularidade).toBe('HORA');
    expect(result.registros).toHaveLength(18);
    expect(result.registros[0]).toEqual({
      DATA: '05/04/2026',
      HORA: '06:00-07:00',
      VALOR: 10,
    });
    expect(result.registros[1]).toEqual({
      DATA: '05/04/2026',
      HORA: '07:00-08:00',
      VALOR: 0,
    });
    expect(result.registros[17]).toEqual({
      DATA: '05/04/2026',
      HORA: '23:00-23:59',
      VALOR: 0,
    });
    expect(result.totalDia).toBe(40);
  });

  it('retorna apenas horas fechadas para o dia atual', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(10);
    db3Client.consultarPorSegmentoPorHora.mockResolvedValue([
      { HORA: '06', VALOR: 15 },
      { HORA: '09', VALOR: 20 },
    ]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(result.registros.map((registro) => registro.HORA)).toEqual([
      '06:00-07:00',
      '07:00-08:00',
      '08:00-09:00',
      '09:00-10:00',
    ]);
    expect(result.registros.map((registro) => registro.VALOR)).toEqual([15, 0, 0, 20]);
    expect(result.totalDia).toBe(35);
  });

  it('mantem faixas zeradas quando a consulta horaria retorna total zero', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(9);
    db3Client.consultarPorSegmentoPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(result.registros).toEqual([
      { DATA: '06/04/2026', HORA: '06:00-07:00', VALOR: 0 },
      { DATA: '06/04/2026', HORA: '07:00-08:00', VALOR: 0 },
      { DATA: '06/04/2026', HORA: '08:00-09:00', VALOR: 0 },
    ]);
    expect(result.totalDia).toBe(0);
    expect(job.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Aplicando fallback para consolidado do dia'),
    );
  });

  it('usa apenas dataIni e registra aviso quando dataFim for diferente', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    db3Client.consultarPorSegmentoPorHora.mockResolvedValue([]);

    const job = createJob({
      dataIni: '2026-04-05',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentoPorHora).toHaveBeenCalledWith(
      '2026-04-05',
      6,
      24,
      '51',
      'GIGA',
    );
    expect(job.log).toHaveBeenCalledWith(
      'Aviso: consulta por hora usa apenas dataIni (2026-04-05). dataFim recebido: 2026-04-06',
    );
  });

  it('retorna vazio quando ainda nao existe hora fechada a partir das 06:00', async () => {
    jest.spyOn(processor as any, 'getTodayFortalezaIso').mockReturnValue('2026-04-06');
    jest.spyOn(processor as any, 'getHoraAtualFortaleza').mockReturnValue(6);

    const job = createJob({
      dataIni: '2026-04-06',
      dataFim: '2026-04-06',
      segmentos: '51',
      tipoEmpresa: 'GIGA',
    });

    const result = await processor.handleVendasResumo(job as any);

    expect(db3Client.consultarPorSegmentoPorHora).not.toHaveBeenCalled();
    expect(result.granularidade).toBe('HORA');
    expect(result.registros).toEqual([]);
    expect(result.totalDia).toBe(0);
  });
});

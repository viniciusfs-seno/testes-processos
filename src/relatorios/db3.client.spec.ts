import { ConfigService } from '@nestjs/config';
import { Db3Client } from './db3.client';

describe('Db3Client', () => {
  let client: Db3Client;
  let dataSourceMock: {
    initialize: jest.Mock;
    query: jest.Mock;
    destroy: jest.Mock;
    isInitialized: boolean;
  };

  beforeEach(() => {
    client = new Db3Client({ get: jest.fn() } as unknown as ConfigService);
    dataSourceMock = {
      initialize: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
    };

    jest.spyOn(client as any, 'createDataSource').mockReturnValue(dataSourceMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('usa o universo explicito do RDP para listar lojas de GIGA', async () => {
    dataSourceMock.query.mockImplementation(async (query: string) => {
      expect(query).toContain('WHERE E.NROEMPRESA IN (101, 102, 103, 105, 106, 107, 108, 109, 112, 113, 114, 115, 116, 117, 300, 301, 304)');
      expect(query).not.toContain("LIKE '%GIGA%'");

      return [{ CODIGO: 101, NOME: 'GIGA LIMAO', NOME_REDUZIDO: 'G01-LIMAO' }];
    });

    const result = await client.listarEmpresasPorFaixa('GIGA');

    expect(result).toHaveLength(17);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ CODIGO: 112, NOME_REDUZIDO: 'G10-VENDA EXTERNA' }),
        expect.objectContaining({ CODIGO: 116, NOME_REDUZIDO: 'G14-CAMPINAS VE' }),
      ]),
    );
  });

  it('usa a lista explicita de lojas do RDP e os segmentos recebidos na consulta por loja', async () => {
    dataSourceMock.query.mockImplementation(async (query: string) => {
      expect(query).toContain('V.NROSEGMENTO IN (1, 10, 24, 27, 28, 29, 63)');
      expect(query).toContain('V.NROEMPRESA IN (101, 102, 103, 105, 106, 107, 108, 109, 112, 113, 114, 115, 116, 117, 300, 301, 304)');
      expect(query).toContain('K.QTDEMBALAGEM = 1');
      expect(query).toContain("DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')");
      expect(query).not.toContain('PDV_DOCTO');
      expect(query).not.toContain('V.CHECKOUT > 0');
      expect(query).not.toContain("LIKE '%GIGA%'");

      return [];
    });

    await client.consultarGigaTotaisPorLoja(
      '2026-04-16',
      5,
      11,
      ['1', '10', '24', '27', '28', '29', '63'],
      'LIQUIDA',
    );

    expect(dataSourceMock.query).toHaveBeenCalled();
  });

  it('mantem mercantil separado sem usar o fallback de GIGA', async () => {
    dataSourceMock.query.mockImplementation(async (query: string) => {
      expect(query).toContain('V.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim');
      expect(query).not.toContain('NOT EXISTS');
      expect(query).not.toContain('PDV_DOCTO PD2');
      expect(query).not.toContain('V.CHECKOUT = 0');

      return [];
    });

    await client.consultarPorSegmento(
      '2026-04-16',
      '2026-04-16',
      '51',
      'MERCANTIL',
    );

    expect(dataSourceMock.query).toHaveBeenCalled();
  });
});

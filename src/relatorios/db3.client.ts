import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';
type TipoConsultaGigaDb3 = 'LIQUIDA' | 'BRUTA' | 'RDP_SIMILAR';
type OracleBindParams = Record<string, string | number>;
type EmpresaDb3 = {
  CODIGO: number;
  NOME: string;
  NOME_REDUZIDO: string | null;
};
type SegmentoDb3 = {
  CODIGO: number;
  DESCRICAO: string;
  STATUS: string | null;
};
type ColunaCatalogoDb3 = {
  OWNER?: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE?: string;
  NULLABLE?: string;
  DATA_LENGTH?: number;
};
type GigaConsultaStrategy = {
  criterioValor:
    | 'vlritem_menos_vlrdevolitem'
    | 'vlritemsemdesc_menos_vlrdevolitemsemdesc'
    | 'vlritem_aproximado_rdp';
  valorExpr: string;
  dataHoraVendaExpr: string;
  fromExtraSql: string;
  whereExtraSql: string;
};

const GIGA_EMPRESAS_RDP = [
  { codigo: 101, nome: 'LIMAO', nomeReduzido: 'G01-LIMAO' },
  { codigo: 102, nome: 'TAMBORE', nomeReduzido: 'G02-TAMBORE' },
  { codigo: 103, nome: 'CACHOEIRINHA', nomeReduzido: 'G07-CACHOEIRINHA' },
  { codigo: 105, nome: 'RAPOSO', nomeReduzido: 'G03-RAPOSO' },
  { codigo: 106, nome: 'JUNDIAI', nomeReduzido: 'G04-JUNDIAI' },
  { codigo: 107, nome: 'CARAPICUIBA', nomeReduzido: 'G05-CARAPICUIBA' },
  { codigo: 108, nome: 'BARRA FUNDA', nomeReduzido: 'G06-BARRA FUNDA' },
  { codigo: 109, nome: 'GUARULHOS', nomeReduzido: 'G08-GUARULHOS' },
  { codigo: 112, nome: 'VENDA EXTERNA', nomeReduzido: 'G10-VENDA EXTERNA' },
  { codigo: 113, nome: 'NACOES UNIDAS', nomeReduzido: 'G12-NACOES UNIDAS' },
  { codigo: 114, nome: 'SAO BERNARDO', nomeReduzido: 'G13-SAO BERNARDO' },
  { codigo: 115, nome: 'CAMPINAS', nomeReduzido: 'G11-CAMPINAS' },
  { codigo: 116, nome: 'CAMPINAS VENDA EXTERNA', nomeReduzido: 'G14-CAMPINAS VE' },
  { codigo: 117, nome: 'SOROCABA', nomeReduzido: 'G17-SOROCABA' },
  { codigo: 300, nome: 'VARZEA', nomeReduzido: 'GC01-VARZEA' },
  { codigo: 301, nome: 'OSASCO', nomeReduzido: 'GC02-OSASCO' },
  { codigo: 304, nome: 'TREMEMBE', nomeReduzido: 'G09-TREMEMBE' },
] as const;

@Injectable()
export class Db3Client {
  constructor(private readonly configService: ConfigService) {}

  private getGigaEmpresasRdp() {
    return [...GIGA_EMPRESAS_RDP];
  }

  private getGigaEmpresasRdpSql() {
    return this.getGigaEmpresasRdp()
      .map((empresa) => empresa.codigo)
      .join(', ');
  }

  private adicionarUmDia(dataIso: string) {
    const data = new Date(`${dataIso}T00:00:00`);
    data.setDate(data.getDate() + 1);

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private validarPeriodo(dataInicial: string, dataFinal: string) {
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas. Use formato YYYY-MM-DD.');
    }

    if (fim < inicio) {
      throw new BadRequestException('Data final não pode ser menor que a inicial.');
    }

    const diffMs = fim.getTime() - inicio.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24) + 1;

    if (diffDias > 31) {
      throw new BadRequestException('Período não pode ser maior que 31 dias.');
    }
  }

  private validarSegmento(segmento: string) {
    if (!/^\d+$/.test(segmento)) {
      throw new BadRequestException(`Segmento inválido: ${segmento}`);
    }
  }

  private validarSegmentos(segmentos: string[]) {
    if (!Array.isArray(segmentos) || segmentos.length === 0) {
      throw new BadRequestException('Informe ao menos um segmento válido.');
    }

    segmentos.forEach((segmento) => this.validarSegmento(segmento));
  }

  private obterFaixaEmpresa(tipoEmpresa: TipoEmpresaDb3) {
    if (tipoEmpresa === 'MERCANTIL') {
      return { inicio: 800, fim: 849 };
    }

    throw new BadRequestException(`Tipo de empresa inválido: ${tipoEmpresa}`);
  }

  private getGigaConsultaStrategy(
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): GigaConsultaStrategy {
    switch (tipoConsultaGiga) {
      case 'BRUTA':
        return {
          criterioValor: 'vlritemsemdesc_menos_vlrdevolitemsemdesc',
          valorExpr: `ROUND(NVL(V.VLRITEMSEMDESC, 0), 2) - ROUND(NVL(V.VLRDEVOLITEMSEMDESC, 0), 2)`,
          dataHoraVendaExpr: `V.DTAHORLANCTO`,
          fromExtraSql: '',
          whereExtraSql: `
          AND V.DTAHORLANCTO IS NOT NULL`,
        };
      case 'RDP_SIMILAR':
        return {
          criterioValor: 'vlritem_aproximado_rdp',
          valorExpr: `ROUND(NVL(V.VLRITEM, 0), 2)`,
          dataHoraVendaExpr: `V.DTAHORLANCTO`,
          fromExtraSql: '',
          whereExtraSql: `
          AND V.DTAHORLANCTO IS NOT NULL`,
        };
      case 'LIQUIDA':
      default:
        return {
          criterioValor: 'vlritem_menos_vlrdevolitem',
          valorExpr: `ROUND(NVL(V.VLRITEM, 0), 2) - ROUND(NVL(V.VLRDEVOLITEM, 0), 2)`,
          dataHoraVendaExpr: `V.DTAHORLANCTO`,
          fromExtraSql: '',
          whereExtraSql: `
          AND V.DTAHORLANCTO IS NOT NULL`,
        };
    }
  }

  private getConsultaSqlConfig(
    tipoEmpresa: TipoEmpresaDb3,
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ) {
    if (tipoEmpresa === 'GIGA') {
      return this.getGigaConsultaStrategy(tipoConsultaGiga);
    }

    return {
      criterioValor: 'vlritem_menos_vlrdevolitem' as const,
      valorExpr: `ROUND(V.VLRITEM, 2) - ROUND(V.VLRDEVOLITEM, 2)`,
      dataHoraVendaExpr: `NVL(V.DTAHORLANCTO, PD.DTAHORAMOVTO)`,
      fromExtraSql: `,
          PDV_DOCTO PD`,
      whereExtraSql: `
          AND V.NROEMPRESA = PD.NROEMPRESA
          AND V.DTAVDA = PD.DTAMOVIMENTO
          AND V.CHECKOUT = PD.NROCHECKOUT
          AND V.NRODOCTO = PD.NUMERODF`,
    };
  }

  private getFiltroEmpresaSql(tipoEmpresa: TipoEmpresaDb3) {
    if (tipoEmpresa === 'GIGA') {
      return `V.NROEMPRESA IN (${this.getGigaEmpresasRdpSql()})`;
    }

    return `V.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim`;
  }

  private getFiltroCheckoutSql(tipoEmpresa: TipoEmpresaDb3, tipoConsultaGiga: TipoConsultaGigaDb3) {
    if (tipoEmpresa === 'GIGA' && tipoConsultaGiga !== 'RDP_SIMILAR') {
      return '';
    }

    return `AND V.CHECKOUT > 0`;
  }

  private createDataSource() {
    return new DataSource({
      type: 'oracle',
      host: this.configService.get<string>('DB3_HOST'),
      port: Number(this.configService.get<string>('DB3_PORT')),
      username: this.configService.get<string>('DB3_USER'),
      password: this.configService.get<string>('DB3_PASS'),
      serviceName: this.configService.get<string>('DB3_SERVICE_NAME'),
      extra: {
        connectTimeout: 60000,
      },
    });
  }

  async consultarPorSegmento(
    dataInicial: string,
    dataFinal: string,
    segmento: string,
    tipoEmpresa: TipoEmpresaDb3,
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): Promise<any[]> {
    this.validarPeriodo(dataInicial, dataFinal);
    this.validarSegmento(segmento);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const consultaConfig = this.getConsultaSqlConfig(tipoEmpresa, tipoConsultaGiga);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const filtroCheckoutSql = this.getFiltroCheckoutSql(tipoEmpresa, tipoConsultaGiga);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${consultaConfig.valorExpr}) AS VALOR
        FROM 
          MRL_CUSTODIAFAM Y,
          MAXV_ABCDISTRIBBASE V,
          MAP_PRODUTO A,
          MAP_PRODUTO PB,
          MAP_FAMDIVISAO D,
          MAP_FAMEMBALAGEM K,
          MAX_EMPRESA E,
          MAX_DIVISAO DV,
          MAP_PRODACRESCCUSTORELAC PR,
          MAP_FAMILIA FAM,
          MAX_CODGERALOPER G2${consultaConfig.fromExtraSql}
        WHERE 
          D.SEQFAMILIA = A.SEQFAMILIA
          AND D.NRODIVISAO = V.NRODIVISAO
          AND V.SEQPRODUTO = A.SEQPRODUTO
          AND V.SEQPRODUTOCUSTO = PB.SEQPRODUTO
          AND V.NRODIVISAO = D.NRODIVISAO
          AND E.NROEMPRESA = V.NROEMPRESA
          AND E.NRODIVISAO = DV.NRODIVISAO
          AND V.SEQPRODUTO = PR.SEQPRODUTO(+)
          AND V.DTAVDA = PR.DTAMOVIMENTACAO(+)
          AND Y.NROEMPRESA = NVL(E.NROEMPCUSTOABC, E.NROEMPRESA)
          AND Y.DTAENTRADASAIDA = V.DTAVDA
          AND K.SEQFAMILIA = A.SEQFAMILIA
          AND Y.SEQFAMILIA = PB.SEQFAMILIA
          AND FAM.SEQFAMILIA = A.SEQFAMILIA
          AND V.CODGERALOPER = G2.CODGERALOPER${consultaConfig.whereExtraSql}
          AND V.NROSEGMENTO = :segmento
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          ${filtroCheckoutSql}
          AND V.DTAVDA BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
        GROUP BY 
          V.DTAVDA
        ORDER BY
          V.DTAVDA
      `;

      const params: OracleBindParams = {
        dataIni: dataInicial,
        dataFim: dataFinal,
        segmento,
        tipoEmpresa,
        ...(faixa
          ? {
              empresaInicio: faixa.inicio,
              empresaFim: faixa.fim,
            }
          : {}),
      };

      return await dataSource.query(query, params as unknown as any[]);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async consultarPorSegmentoPorHora(
    dataReferencia: string,
    horaInicio: number,
    horaFim: number,
    segmento: string,
    tipoEmpresa: TipoEmpresaDb3,
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmento(segmento);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const consultaConfig = this.getConsultaSqlConfig(tipoEmpresa, tipoConsultaGiga);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const filtroCheckoutSql = this.getFiltroCheckoutSql(tipoEmpresa, tipoConsultaGiga);
    const dataSource = this.createDataSource();

    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;

    try {
      await dataSource.initialize();

      const dataHoraVendaExpr = consultaConfig.dataHoraVendaExpr;

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          TO_CHAR(${dataHoraVendaExpr}, 'HH24') AS HORA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${consultaConfig.valorExpr}) AS VALOR
        FROM 
          MRL_CUSTODIAFAM Y,
          MAXV_ABCDISTRIBBASE V,
          MAP_PRODUTO A,
          MAP_PRODUTO PB,
          MAP_FAMDIVISAO D,
          MAP_FAMEMBALAGEM K,
          MAX_EMPRESA E,
          MAX_DIVISAO DV,
          MAP_PRODACRESCCUSTORELAC PR,
          MAP_FAMILIA FAM,
          MAX_CODGERALOPER G2${consultaConfig.fromExtraSql}
        WHERE 
          D.SEQFAMILIA = A.SEQFAMILIA
          AND D.NRODIVISAO = V.NRODIVISAO
          AND V.SEQPRODUTO = A.SEQPRODUTO
          AND V.SEQPRODUTOCUSTO = PB.SEQPRODUTO
          AND V.NRODIVISAO = D.NRODIVISAO
          AND E.NROEMPRESA = V.NROEMPRESA
          AND E.NRODIVISAO = DV.NRODIVISAO
          AND V.SEQPRODUTO = PR.SEQPRODUTO(+)
          AND V.DTAVDA = PR.DTAMOVIMENTACAO(+)
          AND Y.NROEMPRESA = NVL(E.NROEMPCUSTOABC, E.NROEMPRESA)
          AND Y.DTAENTRADASAIDA = V.DTAVDA
          AND K.SEQFAMILIA = A.SEQFAMILIA
          AND Y.SEQFAMILIA = PB.SEQFAMILIA
          AND FAM.SEQFAMILIA = A.SEQFAMILIA
          AND V.CODGERALOPER = G2.CODGERALOPER${consultaConfig.whereExtraSql}
          AND V.NROSEGMENTO = :segmento
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          ${filtroCheckoutSql}
          AND ${dataHoraVendaExpr} >= TO_DATE(:dataIni || ' ' || :horaInicio, 'YYYY-MM-DD HH24:MI')
          AND ${dataHoraVendaExpr} < TO_DATE(:dataFim || ' ' || :horaFim, 'YYYY-MM-DD HH24:MI')
        GROUP BY 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY'),
          TO_CHAR(${dataHoraVendaExpr}, 'HH24')
        ORDER BY
          TO_CHAR(${dataHoraVendaExpr}, 'HH24')
      `;

      const params: OracleBindParams = {
        dataIni: dataReferencia,
        dataFim: dataFimReferencia,
        horaInicio: `${pad(horaInicio)}:00`,
        horaFim: horaFimTexto,
        segmento,
        tipoEmpresa,
        ...(faixa
          ? {
              empresaInicio: faixa.inicio,
              empresaFim: faixa.fim,
            }
          : {}),
      };

      return await dataSource.query(query, params as unknown as any[]);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async consultarPorSegmentosPorHora(
    dataReferencia: string,
    horaInicio: number,
    horaFim: number,
    segmentos: string[],
    tipoEmpresa: TipoEmpresaDb3,
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmentos(segmentos);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const consultaConfig = this.getConsultaSqlConfig(tipoEmpresa, tipoConsultaGiga);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const filtroCheckoutSql = this.getFiltroCheckoutSql(tipoEmpresa, tipoConsultaGiga);
    const dataSource = this.createDataSource();

    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const dataFimDiaExclusiva = this.adicionarUmDia(dataReferencia);
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;
    const dataHoraVendaExpr = consultaConfig.dataHoraVendaExpr;
    const segmentosSql = segmentos.map((segmento) => Number(segmento)).join(', ');

    try {
      await dataSource.initialize();

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          TO_CHAR(${dataHoraVendaExpr}, 'HH24') AS HORA,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${consultaConfig.valorExpr}) AS VALOR
        FROM 
          MRL_CUSTODIAFAM Y,
          MAXV_ABCDISTRIBBASE V,
          MAP_PRODUTO A,
          MAP_PRODUTO PB,
          MAP_FAMDIVISAO D,
          MAP_FAMEMBALAGEM K,
          MAX_EMPRESA E,
          MAX_DIVISAO DV,
          MAP_PRODACRESCCUSTORELAC PR,
          MAP_FAMILIA FAM,
          MAX_CODGERALOPER G2${consultaConfig.fromExtraSql}
        WHERE 
          D.SEQFAMILIA = A.SEQFAMILIA
          AND D.NRODIVISAO = V.NRODIVISAO
          AND V.SEQPRODUTO = A.SEQPRODUTO
          AND V.SEQPRODUTOCUSTO = PB.SEQPRODUTO
          AND V.NRODIVISAO = D.NRODIVISAO
          AND E.NROEMPRESA = V.NROEMPRESA
          AND E.NRODIVISAO = DV.NRODIVISAO
          AND V.SEQPRODUTO = PR.SEQPRODUTO(+)
          AND V.DTAVDA = PR.DTAMOVIMENTACAO(+)
          AND Y.NROEMPRESA = NVL(E.NROEMPCUSTOABC, E.NROEMPRESA)
          AND Y.DTAENTRADASAIDA = V.DTAVDA
          AND K.SEQFAMILIA = A.SEQFAMILIA
          AND Y.SEQFAMILIA = PB.SEQFAMILIA
          AND FAM.SEQFAMILIA = A.SEQFAMILIA
          AND V.CODGERALOPER = G2.CODGERALOPER${consultaConfig.whereExtraSql}
          AND V.NROSEGMENTO IN (${segmentosSql})
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          ${filtroCheckoutSql}
          AND V.DTAVDA >= TO_DATE(:dataIni, 'YYYY-MM-DD')
          AND V.DTAVDA < TO_DATE(:dataFimDia, 'YYYY-MM-DD')
          AND ${dataHoraVendaExpr} >= TO_DATE(:dataIni || ' ' || :horaInicio, 'YYYY-MM-DD HH24:MI')
          AND ${dataHoraVendaExpr} < TO_DATE(:dataHoraFim || ' ' || :horaFim, 'YYYY-MM-DD HH24:MI')
        GROUP BY 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY'),
          TO_CHAR(${dataHoraVendaExpr}, 'HH24')
        ORDER BY
          TO_CHAR(${dataHoraVendaExpr}, 'HH24')
      `;

      const params: OracleBindParams = {
        dataIni: dataReferencia,
        dataFimDia: dataFimDiaExclusiva,
        dataHoraFim: dataFimReferencia,
        horaInicio: `${pad(horaInicio)}:00`,
        horaFim: horaFimTexto,
        tipoEmpresa,
        ...(faixa
          ? {
              empresaInicio: faixa.inicio,
              empresaFim: faixa.fim,
            }
          : {}),
      };

      return await dataSource.query(query, params as unknown as any[]);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async listarEmpresasPorFaixa(tipoEmpresa: TipoEmpresaDb3): Promise<EmpresaDb3[]> {
    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query =
        tipoEmpresa === 'GIGA'
          ? `
              SELECT
                E.NROEMPRESA AS CODIGO,
                COALESCE(E.FANTASIA, E.NOMEREDUZIDO, E.RAZAOSOCIAL) AS NOME,
                E.NOMEREDUZIDO AS NOME_REDUZIDO
              FROM MAX_EMPRESA E
              WHERE E.NROEMPRESA IN (${this.getGigaEmpresasRdpSql()})
              ORDER BY E.NROEMPRESA
            `
          : `
              SELECT
                E.NROEMPRESA AS CODIGO,
                COALESCE(E.FANTASIA, E.NOMEREDUZIDO, E.RAZAOSOCIAL) AS NOME,
                E.NOMEREDUZIDO AS NOME_REDUZIDO
              FROM MAX_EMPRESA E
              WHERE E.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim
              ORDER BY E.NROEMPRESA
            `;

      const params = faixa
        ? ({
            empresaInicio: faixa.inicio,
            empresaFim: faixa.fim,
          } as unknown as any[])
        : [];
      const rows = await dataSource.query(query, params);
      if (tipoEmpresa !== 'GIGA') {
        return rows;
      }

      const rowsMap = new Map<number, EmpresaDb3>(
        rows.map((row: any) => [
          Number(row.CODIGO),
          {
            CODIGO: Number(row.CODIGO),
            NOME: row.NOME ?? row.NOME_REDUZIDO ?? row.CODIGO,
            NOME_REDUZIDO: row.NOME_REDUZIDO ?? null,
          },
        ]),
      );

      return this.getGigaEmpresasRdp().map((empresa) => ({
        CODIGO: empresa.codigo,
        NOME: rowsMap.get(empresa.codigo)?.NOME ?? empresa.nome,
        NOME_REDUZIDO: rowsMap.get(empresa.codigo)?.NOME_REDUZIDO ?? empresa.nomeReduzido,
      }));
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async listarSegmentosDetalhados(segmentos: string[]): Promise<SegmentoDb3[]> {
    this.validarSegmentos(segmentos);

    const dataSource = this.createDataSource();
    const segmentosSql = segmentos.map((segmento) => Number(segmento)).join(', ');

    try {
      await dataSource.initialize();

      const query = `
        SELECT
          S.NROSEGMENTO AS CODIGO,
          S.DESCSEGMENTO AS DESCRICAO,
          S.STATUS
        FROM VPALM_SEGMENTO S
        WHERE S.NROSEGMENTO IN (${segmentosSql})
        ORDER BY S.NROSEGMENTO
      `;

      return await dataSource.query(query);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async listarTodosSegmentosPossiveis(): Promise<SegmentoDb3[]> {
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT
          S.NROSEGMENTO AS CODIGO,
          S.DESCSEGMENTO AS DESCRICAO,
          S.STATUS
        FROM VPALM_SEGMENTO S
        ORDER BY S.NROSEGMENTO
      `;

      return await dataSource.query(query);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async consultarGigaTotaisPorLoja(
    dataReferencia: string,
    horaInicio: number,
    horaFim: number,
    segmentos: string[],
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmentos(segmentos);

    const consultaConfig = this.getConsultaSqlConfig('GIGA', tipoConsultaGiga);
    const filtroEmpresaSql = this.getFiltroEmpresaSql('GIGA');
    const filtroCheckoutSql = this.getFiltroCheckoutSql('GIGA', tipoConsultaGiga);
    const dataSource = this.createDataSource();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const dataFimDiaExclusiva = this.adicionarUmDia(dataReferencia);
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;
    const dataHoraVendaExpr = consultaConfig.dataHoraVendaExpr;
    const segmentosSql = segmentos.map((segmento) => Number(segmento)).join(', ');

    try {
      await dataSource.initialize();

      const query = `
        SELECT
          E.NROEMPRESA AS CODIGO,
          COALESCE(E.FANTASIA, E.NOMEREDUZIDO, E.RAZAOSOCIAL) AS NOME,
          E.NOMEREDUZIDO AS NOME_REDUZIDO,
          SUM(${consultaConfig.valorExpr}) AS VALOR
        FROM
          MRL_CUSTODIAFAM Y,
          MAXV_ABCDISTRIBBASE V,
          MAP_PRODUTO A,
          MAP_PRODUTO PB,
          MAP_FAMDIVISAO D,
          MAP_FAMEMBALAGEM K,
          MAX_EMPRESA E,
          MAX_DIVISAO DV,
          MAP_PRODACRESCCUSTORELAC PR,
          MAP_FAMILIA FAM,
          MAX_CODGERALOPER G2${consultaConfig.fromExtraSql}
        WHERE
          D.SEQFAMILIA = A.SEQFAMILIA
          AND D.NRODIVISAO = V.NRODIVISAO
          AND V.SEQPRODUTO = A.SEQPRODUTO
          AND V.SEQPRODUTOCUSTO = PB.SEQPRODUTO
          AND V.NRODIVISAO = D.NRODIVISAO
          AND E.NROEMPRESA = V.NROEMPRESA
          AND E.NRODIVISAO = DV.NRODIVISAO
          AND V.SEQPRODUTO = PR.SEQPRODUTO(+)
          AND V.DTAVDA = PR.DTAMOVIMENTACAO(+)
          AND Y.NROEMPRESA = NVL(E.NROEMPCUSTOABC, E.NROEMPRESA)
          AND Y.DTAENTRADASAIDA = V.DTAVDA
          AND K.SEQFAMILIA = A.SEQFAMILIA
          AND Y.SEQFAMILIA = PB.SEQFAMILIA
          AND FAM.SEQFAMILIA = A.SEQFAMILIA
          AND V.CODGERALOPER = G2.CODGERALOPER${consultaConfig.whereExtraSql}
          AND V.NROSEGMENTO IN (${segmentosSql})
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          ${filtroCheckoutSql}
          AND V.DTAVDA >= TO_DATE(:dataIni, 'YYYY-MM-DD')
          AND V.DTAVDA < TO_DATE(:dataFimDia, 'YYYY-MM-DD')
          AND ${dataHoraVendaExpr} >= TO_DATE(:dataIni || ' ' || :horaInicio, 'YYYY-MM-DD HH24:MI')
          AND ${dataHoraVendaExpr} < TO_DATE(:dataHoraFim || ' ' || :horaFim, 'YYYY-MM-DD HH24:MI')
        GROUP BY
          E.NROEMPRESA,
          COALESCE(E.FANTASIA, E.NOMEREDUZIDO, E.RAZAOSOCIAL),
          E.NOMEREDUZIDO
        ORDER BY E.NROEMPRESA
      `;

      const params: OracleBindParams = {
        dataIni: dataReferencia,
        dataFimDia: dataFimDiaExclusiva,
        dataHoraFim: dataFimReferencia,
        horaInicio: `${pad(horaInicio)}:00`,
        horaFim: horaFimTexto,
      };

      return await dataSource.query(query, params as unknown as any[]);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async consultarGigaTotaisPorSegmento(
    dataReferencia: string,
    horaInicio: number,
    horaFim: number,
    segmentos: string[],
    tipoConsultaGiga: TipoConsultaGigaDb3 = 'LIQUIDA',
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmentos(segmentos);

    const consultaConfig = this.getConsultaSqlConfig('GIGA', tipoConsultaGiga);
    const filtroEmpresaSql = this.getFiltroEmpresaSql('GIGA');
    const filtroCheckoutSql = this.getFiltroCheckoutSql('GIGA', tipoConsultaGiga);
    const dataSource = this.createDataSource();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const dataFimDiaExclusiva = this.adicionarUmDia(dataReferencia);
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;
    const dataHoraVendaExpr = consultaConfig.dataHoraVendaExpr;
    const segmentosSql = segmentos.map((segmento) => Number(segmento)).join(', ');

    try {
      await dataSource.initialize();

      const query = `
        SELECT
          S.NROSEGMENTO AS CODIGO,
          S.DESCSEGMENTO AS DESCRICAO,
          S.STATUS,
          SUM(${consultaConfig.valorExpr}) AS VALOR
        FROM
          MRL_CUSTODIAFAM Y,
          MAXV_ABCDISTRIBBASE V,
          MAP_PRODUTO A,
          MAP_PRODUTO PB,
          MAP_FAMDIVISAO D,
          MAP_FAMEMBALAGEM K,
          MAX_EMPRESA E,
          MAX_DIVISAO DV,
          MAP_PRODACRESCCUSTORELAC PR,
          MAP_FAMILIA FAM,
          MAX_CODGERALOPER G2,
          VPALM_SEGMENTO S${consultaConfig.fromExtraSql}
        WHERE
          D.SEQFAMILIA = A.SEQFAMILIA
          AND D.NRODIVISAO = V.NRODIVISAO
          AND V.SEQPRODUTO = A.SEQPRODUTO
          AND V.SEQPRODUTOCUSTO = PB.SEQPRODUTO
          AND V.NRODIVISAO = D.NRODIVISAO
          AND E.NROEMPRESA = V.NROEMPRESA
          AND E.NRODIVISAO = DV.NRODIVISAO
          AND V.SEQPRODUTO = PR.SEQPRODUTO(+)
          AND V.DTAVDA = PR.DTAMOVIMENTACAO(+)
          AND Y.NROEMPRESA = NVL(E.NROEMPCUSTOABC, E.NROEMPRESA)
          AND Y.DTAENTRADASAIDA = V.DTAVDA
          AND K.SEQFAMILIA = A.SEQFAMILIA
          AND Y.SEQFAMILIA = PB.SEQFAMILIA
          AND FAM.SEQFAMILIA = A.SEQFAMILIA
          AND V.CODGERALOPER = G2.CODGERALOPER${consultaConfig.whereExtraSql}
          AND V.NROSEGMENTO = S.NROSEGMENTO
          AND V.NROSEGMENTO IN (${segmentosSql})
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          ${filtroCheckoutSql}
          AND V.DTAVDA >= TO_DATE(:dataIni, 'YYYY-MM-DD')
          AND V.DTAVDA < TO_DATE(:dataFimDia, 'YYYY-MM-DD')
          AND ${dataHoraVendaExpr} >= TO_DATE(:dataIni || ' ' || :horaInicio, 'YYYY-MM-DD HH24:MI')
          AND ${dataHoraVendaExpr} < TO_DATE(:dataHoraFim || ' ' || :horaFim, 'YYYY-MM-DD HH24:MI')
        GROUP BY
          S.NROSEGMENTO,
          S.DESCSEGMENTO,
          S.STATUS
        ORDER BY S.NROSEGMENTO
      `;

      const params: OracleBindParams = {
        dataIni: dataReferencia,
        dataFimDia: dataFimDiaExclusiva,
        dataHoraFim: dataFimReferencia,
        horaInicio: `${pad(horaInicio)}:00`,
        horaFim: horaFimTexto,
      };

      return await dataSource.query(query, params as unknown as any[]);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }

  async listarCatalogoColunasGiga(): Promise<ColunaCatalogoDb3[]> {
    const dataSource = this.createDataSource();
    const tabelas = ['MAXV_ABCDISTRIBBASE', 'PDV_DOCTO', 'MAX_EMPRESA', 'VPALM_SEGMENTO'];
    const tabelasSql = tabelas.map((table) => `'${table}'`).join(', ');

    try {
      await dataSource.initialize();

      const allColumnsQuery = `
        SELECT
          OWNER,
          TABLE_NAME,
          COLUMN_NAME,
          DATA_TYPE,
          NULLABLE,
          DATA_LENGTH
        FROM ALL_TAB_COLUMNS
        WHERE TABLE_NAME IN (${tabelasSql})
        ORDER BY TABLE_NAME, COLUMN_ID
      `;

      try {
        return await dataSource.query(allColumnsQuery);
      } catch (error) {
        const userColumnsQuery = `
          SELECT
            USER AS OWNER,
            TABLE_NAME,
            COLUMN_NAME,
            DATA_TYPE,
            NULLABLE,
            DATA_LENGTH
          FROM USER_TAB_COLUMNS
          WHERE TABLE_NAME IN (${tabelasSql})
          ORDER BY TABLE_NAME, COLUMN_ID
        `;

        return await dataSource.query(userColumnsQuery);
      }
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }
}

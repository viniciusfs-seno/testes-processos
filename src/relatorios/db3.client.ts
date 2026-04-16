import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';
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

@Injectable()
export class Db3Client {
  constructor(private readonly configService: ConfigService) {}

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

  private getValorExpr(tipoEmpresa: TipoEmpresaDb3) {
    if (tipoEmpresa === 'GIGA') {
      return `ROUND(NVL(V.VLRITEMSEMDESC, 0), 2) - ROUND(NVL(V.VLRDEVOLITEMSEMDESC, 0), 2)`;
    }

    return `ROUND(V.VLRITEM, 2) - (ROUND(V.VLRDEVOLITEM, 2) - 0)`;
  }

  private getFiltroEmpresaSql(tipoEmpresa: TipoEmpresaDb3) {
    if (tipoEmpresa === 'GIGA') {
      return `
        V.NROEMPRESA IN (
          SELECT E2.NROEMPRESA
          FROM MAX_EMPRESA E2
          WHERE E2.STATUS = 'A'
            AND UPPER(COALESCE(E2.FANTASIA, E2.NOMEREDUZIDO, E2.RAZAOSOCIAL)) LIKE '%GIGA%'
        )
      `;
    }

    return `V.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim`;
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
  ): Promise<any[]> {
    this.validarPeriodo(dataInicial, dataFinal);
    this.validarSegmento(segmento);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const valorExpr = this.getValorExpr(tipoEmpresa);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${valorExpr}) AS VALOR
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
          PDV_DOCTO PD
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
          AND V.CODGERALOPER = G2.CODGERALOPER
          AND V.NROEMPRESA = PD.NROEMPRESA
          AND V.DTAVDA = PD.DTAMOVIMENTO
          AND V.CHECKOUT = PD.NROCHECKOUT
          AND V.NRODOCTO = PD.NUMERODF
          AND V.NROSEGMENTO = :segmento
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
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
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmento(segmento);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const valorExpr = this.getValorExpr(tipoEmpresa);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const dataSource = this.createDataSource();

    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;

    try {
      await dataSource.initialize();

      const dataHoraVendaExpr = `NVL(V.DTAHORLANCTO, PD.DTAHORAMOVTO)`;

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          TO_CHAR(${dataHoraVendaExpr}, 'HH24') AS HORA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${valorExpr}) AS VALOR
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
          PDV_DOCTO PD
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
          AND V.CODGERALOPER = G2.CODGERALOPER
          AND V.NROEMPRESA = PD.NROEMPRESA
          AND V.DTAVDA = PD.DTAMOVIMENTO
          AND V.CHECKOUT = PD.NROCHECKOUT
          AND V.NRODOCTO = PD.NUMERODF
          AND V.NROSEGMENTO = :segmento
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
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
  ): Promise<any[]> {
    this.validarPeriodo(dataReferencia, dataReferencia);
    this.validarSegmentos(segmentos);

    const faixa = tipoEmpresa === 'MERCANTIL' ? this.obterFaixaEmpresa(tipoEmpresa) : null;
    const valorExpr = this.getValorExpr(tipoEmpresa);
    const filtroEmpresaSql = this.getFiltroEmpresaSql(tipoEmpresa);
    const dataSource = this.createDataSource();

    const pad = (value: number) => value.toString().padStart(2, '0');
    const dataFimReferencia = horaFim >= 24 ? this.adicionarUmDia(dataReferencia) : dataReferencia;
    const dataFimDiaExclusiva = this.adicionarUmDia(dataReferencia);
    const horaFimTexto = horaFim >= 24 ? '00:00' : `${pad(horaFim)}:00`;
    const dataHoraVendaExpr = `NVL(V.DTAHORLANCTO, PD.DTAHORAMOVTO)`;
    const segmentosSql = segmentos.map((segmento) => Number(segmento)).join(', ');

    try {
      await dataSource.initialize();

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          TO_CHAR(${dataHoraVendaExpr}, 'HH24') AS HORA,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(${valorExpr}) AS VALOR
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
          PDV_DOCTO PD
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
          AND V.CODGERALOPER = G2.CODGERALOPER
          AND V.NROEMPRESA = PD.NROEMPRESA
          AND V.DTAVDA = PD.DTAMOVIMENTO
          AND V.CHECKOUT = PD.NROCHECKOUT
          AND V.NRODOCTO = PD.NUMERODF
          AND V.NROSEGMENTO IN (${segmentosSql})
          AND ${filtroEmpresaSql}
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
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
              WHERE E.STATUS = 'A'
                AND UPPER(COALESCE(E.FANTASIA, E.NOMEREDUZIDO, E.RAZAOSOCIAL)) LIKE '%GIGA%'
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

      return await dataSource.query(query, params);
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
}

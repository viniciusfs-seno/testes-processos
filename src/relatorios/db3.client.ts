import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';

@Injectable()
export class Db3Client {
  constructor(private readonly configService: ConfigService) {}

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

  private obterFaixaEmpresa(tipoEmpresa: TipoEmpresaDb3) {
    if (tipoEmpresa === 'MERCANTIL') {
      return { inicio: 800, fim: 849 };
    }

    if (tipoEmpresa === 'GIGA') {
      return { inicio: 101, fim: 159 };
    }

    throw new BadRequestException(`Tipo de empresa inválido: ${tipoEmpresa}`);
  }

  async consultarPorSegmento(
    dataInicial: string,
    dataFinal: string,
    segmento: string,
    tipoEmpresa: TipoEmpresaDb3,
  ): Promise<any[]> {
    this.validarPeriodo(dataInicial, dataFinal);
    this.validarSegmento(segmento);

    const faixa = this.obterFaixaEmpresa(tipoEmpresa);

    const dataSource = new DataSource({
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

    try {
      await dataSource.initialize();

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(
            ROUND(V.VLRITEM, 2) - (ROUND(V.VLRDEVOLITEM, 2) - 0)
          ) AS VALOR
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
          AND V.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
          AND V.DTAVDA BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
        GROUP BY 
          V.DTAVDA
        ORDER BY
          V.DTAVDA
      `;

      const params = {
        dataIni: dataInicial,
        dataFim: dataFinal,
        segmento,
        tipoEmpresa,
        empresaInicio: faixa.inicio,
        empresaFim: faixa.fim,
      };

      const result = await dataSource.query(query, params);
      return result;
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

    const faixa = this.obterFaixaEmpresa(tipoEmpresa);
    const dataSource = new DataSource({
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

    const pad = (value: number) => value.toString().padStart(2, '0');
    const addDays = (dateIso: string, days: number) => {
      const [ano, mes, dia] = dateIso.split('-').map(Number);
      const base = new Date(ano, mes - 1, dia);
      base.setDate(base.getDate() + days);
      const y = base.getFullYear();
      const m = String(base.getMonth() + 1).padStart(2, '0');
      const d = String(base.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    try {
      await dataSource.initialize();

      const dataFim =
        horaFim === 24 ? addDays(dataReferencia, 1) : dataReferencia;
      const horaFimLabel = horaFim === 24 ? '00:00' : `${pad(horaFim)}:00`;

      const query = `
        SELECT 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY') AS DATA,
          TO_CHAR(V.DTAVDA, 'HH24') AS HORA,
          :segmento AS SEGMENTO,
          :tipoEmpresa AS TIPO_EMPRESA,
          SUM(
            ROUND(V.VLRITEM, 2) - (ROUND(V.VLRDEVOLITEM, 2) - 0)
          ) AS VALOR
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
          AND V.NROEMPRESA BETWEEN :empresaInicio AND :empresaFim
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
          AND V.DTAVDA >= TO_DATE(:dataIni || ' ' || :horaInicio, 'YYYY-MM-DD HH24:MI')
          AND V.DTAVDA < TO_DATE(:dataFim || ' ' || :horaFim, 'YYYY-MM-DD HH24:MI')
        GROUP BY 
          TO_CHAR(V.DTAVDA, 'DD/MM/YYYY'),
          TO_CHAR(V.DTAVDA, 'HH24')
        ORDER BY
          TO_CHAR(V.DTAVDA, 'HH24')
      `;

      const params = {
        dataIni: dataReferencia,
        dataFim,
        horaInicio: `${pad(horaInicio)}:00`,
        horaFim: horaFimLabel,
        segmento,
        tipoEmpresa,
        empresaInicio: faixa.inicio,
        empresaFim: faixa.fim,
      };

      const result = await dataSource.query(query, params);
      return result;
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }
}

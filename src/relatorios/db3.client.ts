import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

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

  // PÚBLICO: usado pelo processor
  async consultarPorSegmento(
    dataInicial: string,
    dataFinal: string,
    segmento: string,
  ): Promise<any[]> {
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
          ${segmento} AS SEGMENTO,
          SUM( ( ROUND( V.VLRITEM, 2 ) ) - ( ROUND( V.VLRDEVOLITEM, 2 ) - ( 0 ) ) ) AS VALOR
        FROM 
          MRL_CUSTODIAFAM Y, MAXV_ABCDISTRIBBASE V, MAP_PRODUTO A, MAP_PRODUTO PB, 
          MAP_FAMDIVISAO D, MAP_FAMEMBALAGEM K, MAX_EMPRESA E, MAX_DIVISAO DV, 
          MAP_PRODACRESCCUSTORELAC PR, MAP_FAMILIA FAM, MAX_CODGERALOPER G2, PDV_DOCTO PD
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
          AND V.NROEMPRESA > 0
          AND V.NROSEGMENTO = '${segmento}'
          AND K.QTDEMBALAGEM = 1
          AND DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')
          AND V.CHECKOUT > 0
          AND V.DTAVDA BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
        GROUP BY 
          V.DTAVDA
        ORDER BY
          V.DTAVDA
      `;

      const result = await dataSource.query(query, [dataInicial, dataFinal]);
      return result;
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  }
}

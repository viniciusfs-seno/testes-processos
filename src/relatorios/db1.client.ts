import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class Db1Client {
  constructor(private readonly configService: ConfigService) { }

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

  async resumoCnsd(dataInicial: string, dataFinal: string) {
    this.validarPeriodo(dataInicial, dataFinal);

    const dataSource = new DataSource({
      type: 'oracle',
      host: this.configService.get<string>('DB1_HOST'),
      port: Number(this.configService.get<string>('DB1_PORT')),
      username: this.configService.get<string>('DB1_USER'),
      password: this.configService.get<string>('DB1_PASS'),
      sid: this.configService.get<string>('DB1_SID'),
      extra: {
        connectTimeout: 60000,
      },
    });

    try {
      await dataSource.initialize();

      const query = `
          SELECT
              TRUNC(DATA) AS DATA,
              BANDEIRA,
              NVL(SUM(VENDAS_TICKET - GE), 0) AS TOTAL_EMPORIUM
          FROM 
              (
              SELECT
                  S.FISCAL_DATE AS DATA,
                  CASE
                      WHEN S.STORE_KEY BETWEEN 1 AND 499 THEN 'GBARBOSA'
                      WHEN S.STORE_KEY BETWEEN 500 AND 699 THEN 'BRETAS'
                      WHEN S.STORE_KEY BETWEEN 700 AND 799 THEN 'PREZUNIC'
                      WHEN S.STORE_KEY BETWEEN 800 AND 849 THEN 'MERCANTIL'
                      WHEN S.STORE_KEY BETWEEN 850 AND 899 THEN 'PERINI'
                      WHEN S.STORE_KEY BETWEEN 900 AND 999 THEN 'GIGA'
                      WHEN S.STORE_KEY > 999 THEN 'SPID'
                  END AS BANDEIRA,
                  S.STORE_KEY AS LOJA,
                  SUM(S.AMOUNT_DUE) AS VENDAS_TICKET,
                  SUM(COALESCE((SELECT SUM(G.SIS_PRICE) FROM EMPORIUM.SALE_ITEM_SERVICE G WHERE G.STORE_KEY = S.STORE_KEY AND G.POS_NUMBER = S.POS_NUMBER AND G.TICKET_NUMBER = S.TICKET_NUMBER AND G.START_TIME = S.START_TIME), 0)) AS GE
              FROM
                  EMPORIUM.SALE S
              WHERE 
                  S.SALE_TYPE = 0 AND
                  S.VOIDED = 0 AND
                  S.FISCAL_DATE BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
              GROUP BY
                  S.FISCAL_DATE, S.STORE_KEY
              ) A
          GROUP BY
              TRUNC(DATA), BANDEIRA
          ORDER BY
              CASE BANDEIRA
                  WHEN 'GBARBOSA' THEN 1
                  WHEN 'BRETAS' THEN 2
                  WHEN 'PREZUNIC' THEN 3
                  WHEN 'PERINI' THEN 4
                  WHEN 'SPID' THEN 5
                  ELSE 6
              END, TRUNC(DATA)
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

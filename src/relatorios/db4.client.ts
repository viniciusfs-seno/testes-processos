import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class Db4Client {
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

  private createDataSource(): DataSource {
    return new DataSource({
      type: 'mysql',
      host: this.configService.get<string>('DB4_HOST'),
      port: Number(this.configService.get<string>('DB4_PORT')),
      username: this.configService.get<string>('DB4_USER'),
      password: this.configService.get<string>('DB4_PASS'),
      database: this.configService.get<string>('DB4Context_DB'),
      extra: { connectTimeout: 60000 },
    });
  }

  async vendasResumo(dataInicial: string, dataFinal: string, cdLoja: number = 0) {
    this.validarPeriodo(dataInicial, dataFinal);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT  DATA,
                CDLOJA AS LOJA,
                TOTALTICKET,
                TOTALITENS,
                TOTALFISCAL
        FROM (
            SELECT A.FISCAL_DATE AS DATA,
                   A.STORE_KEY AS CDLOJA,
                   IFNULL(ROUND(SUM(A.AMOUNT_DUE),2),0) AS TOTALTICKET,
                   IFNULL((
                       SELECT ROUND(SUM(B.AMOUNT),2)
                       FROM emporium.accum_item B
                       WHERE B.STORE_KEY = A.STORE_KEY
                         AND B.FISCAL_DATE = A.FISCAL_DATE
                         AND B.POS_NUMBER > 0
                   ),0) AS TOTALITENS,
                   IFNULL((
                       SELECT ROUND(SUM((FINAL_GT - INITIAL_GT)-VOID -DISCOUNT),2)
                       FROM emporium.fiscal_status C
                       WHERE C.STORE_KEY = A.STORE_KEY
                         AND C.FISCAL_DATE = A.FISCAL_DATE
                         AND C.Z_NUMBER > 0
                         AND C.POS_NUMBER > 0
                   ),0) AS TOTALFISCAL
            FROM emporium.sale A
            WHERE (? = 0 OR A.STORE_KEY = ?)
              AND A.FISCAL_DATE BETWEEN ? AND ?
              AND A.POS_NUMBER > 0
              AND A.VOIDED = 0
              AND A.SALE_TYPE = 0
            GROUP BY A.FISCAL_DATE, A.STORE_KEY
            ORDER BY A.FISCAL_DATE, A.STORE_KEY
        ) AS VENDAS
        GROUP BY DATA, CDLOJA
      `;

      return await dataSource.query(query, [cdLoja, cdLoja, dataInicial, dataFinal]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }

  async vendasDetalhe(data: string, cdLoja: number) {
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT  DATA,
                CDLOJA AS LOJA,
                PDV,
                TOTALTICKET,
                TOTALITENS,
                TOTALFISCAL
        FROM (
            SELECT A.FISCAL_DATE AS DATA,
                   A.STORE_KEY AS CDLOJA,
                   A.POS_NUMBER AS PDV,
                   IFNULL(ROUND(SUM(A.AMOUNT_DUE),2),0) AS TOTALTICKET,
                   IFNULL((
                       SELECT ROUND(SUM(B.AMOUNT),2)
                       FROM emporium.accum_item B
                       WHERE B.STORE_KEY = A.STORE_KEY
                         AND B.FISCAL_DATE = A.FISCAL_DATE
                         AND B.POS_NUMBER = A.POS_NUMBER
                   ),0) AS TOTALITENS,
                   IFNULL((
                       SELECT ROUND(SUM((FINAL_GT - INITIAL_GT)-VOID -DISCOUNT),2)
                       FROM emporium.fiscal_status C
                       WHERE C.STORE_KEY = A.STORE_KEY
                         AND C.FISCAL_DATE = A.FISCAL_DATE
                         AND C.Z_NUMBER > 0
                         AND C.POS_NUMBER = A.POS_NUMBER
                   ),0) AS TOTALFISCAL
            FROM emporium.sale A
            WHERE A.FISCAL_DATE = ?
              AND A.STORE_KEY = ?
              AND A.VOIDED = 0
              AND A.SALE_TYPE = 0
            GROUP BY A.FISCAL_DATE, A.STORE_KEY, A.POS_NUMBER
            ORDER BY A.FISCAL_DATE, A.STORE_KEY
        ) AS VENDAS
        GROUP BY DATA, CDLOJA, PDV
      `;

      return await dataSource.query(query, [data, cdLoja]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }

  async vendasTotal(dataInicial: string, dataFinal: string) {
    this.validarPeriodo(dataInicial, dataFinal);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT DATA,
               SUM(TOTALTICKET) AS TOTALTICKET,
               SUM(TOTALITENS)  AS TOTALITENS,
               SUM(TOTALFISCAL) AS TOTALFISCAL
        FROM (
            SELECT A.FISCAL_DATE AS DATA,
                   IFNULL(ROUND(SUM(A.AMOUNT_DUE),2),0) AS TOTALTICKET,
                   IFNULL((
                       SELECT ROUND(SUM(B.AMOUNT),2)
                       FROM emporium.accum_item B
                       WHERE B.STORE_KEY = A.STORE_KEY
                         AND B.FISCAL_DATE = A.FISCAL_DATE
                         AND B.POS_NUMBER > 0
                   ),0) AS TOTALITENS,
                   IFNULL((
                       SELECT ROUND(SUM((FINAL_GT - INITIAL_GT)-VOID -DISCOUNT),2)
                       FROM emporium.fiscal_status C
                       WHERE C.STORE_KEY = A.STORE_KEY
                         AND C.FISCAL_DATE = A.FISCAL_DATE
                         AND C.Z_NUMBER > 0
                         AND C.POS_NUMBER > 0
                   ),0) AS TOTALFISCAL
            FROM emporium.sale A
            WHERE A.FISCAL_DATE BETWEEN ? AND ?
              AND A.POS_NUMBER > 0
              AND A.VOIDED = 0
              AND A.SALE_TYPE = 0
            GROUP BY A.FISCAL_DATE, A.STORE_KEY
        ) AS VENDAS
        GROUP BY DATA
        ORDER BY DATA
      `;

      return await dataSource.query(query, [dataInicial, dataFinal]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }
}

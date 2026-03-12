import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class Db2Client {
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

  async vendasEmporiumResumo(dataInicial: string, dataFinal: string) {
    this.validarPeriodo(dataInicial, dataFinal);

    const dataSource = new DataSource({
      type: 'oracle',
      host: this.configService.get<string>('DB2_HOST'),
      port: Number(this.configService.get<string>('DB2_PORT')),
      username: this.configService.get<string>('DB2_USER'),
      password: this.configService.get<string>('DB2_PASS'),
      serviceName: this.configService.get<string>('DB2_SERVICE_NAME'),
      extra: {
        connectTimeout: 60000,  // 1 minuto para conectar
      },
    });

    try {
      await dataSource.initialize();

      const query = `
        SELECT
          TO_CHAR(S.FISCAL_DATE, 'DD/MM/YYYY') AS DATA,
          SUM(
            CASE 
              WHEN SI.VOIDED = 1 THEN SI.AMOUNT * -1 
              ELSE SI.AMOUNT 
            END
          ) AS VALOR
        FROM
          EMPORIUM.SALE S,
          EMPORIUM.SALE_ITEM SI,
          EMPORIUM.CNSD_STORE_DP_C5 CSDC
        WHERE
          S.STORE_KEY = SI.STORE_KEY AND
          S.POS_NUMBER = SI.POS_NUMBER AND
          S.START_TIME = SI.START_TIME AND
          S.TICKET_NUMBER = SI.TICKET_NUMBER AND
          S.STORE_KEY = CSDC.STORE_KEY AND
          S.STORE_KEY > 0 AND
          S.POS_NUMBER > 0 AND
          S.TICKET_NUMBER > 0 AND
          S.SALE_TYPE = 65 AND
          S.VOIDED = 0
          AND S.FISCAL_DATE BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
        GROUP BY
          S.FISCAL_DATE
        ORDER BY
          S.FISCAL_DATE
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

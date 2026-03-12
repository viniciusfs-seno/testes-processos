import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class Db5Client {
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
      type: 'oracle',
      username: this.configService.get<string>('DB5_USER'),
      password: this.configService.get<string>('DB5_PASS'),
      connectString: this.configService.get<string>('DB5_SERVICE_NAME'),
      extra: { connectTimeout: 60000 },
    });
  }

  async nfResumo(dataInicial: string, dataFinal: string, cdLoja: number = 0) {
    this.validarPeriodo(dataInicial, dataFinal);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT TI041_DATA_EMISSAO_IU AS DATA,
               TI041_UNIDADE_IU AS LOJA,
               SUM(TI041_VALOR_TOTAL_NOTA_FISCAL) AS VALOR_TOTAL
        FROM TI041_NF_SAIDA
        WHERE (${cdLoja} = 0 OR TI041_UNIDADE_IU = ${cdLoja})
          AND TI041_DATA_EMISSAO_IU BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
          AND TI041_TIPO_NOTA_FISCAL_IU = 'K'
          AND TI041_SISTEMA_DESTINO_IE = 22
          AND TI041_OPERACAO_REGISTRO = 'I'
        GROUP BY TI041_DATA_EMISSAO_IU, TI041_UNIDADE_IU
        ORDER BY TI041_DATA_EMISSAO_IU, TI041_UNIDADE_IU
      `;

      return await dataSource.query(query, [dataInicial, dataFinal]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }

  async nfDetalhe(data: string, cdLoja: number) {
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT TI041_DATA_EMISSAO_IU AS DATA,
               TI041_UNIDADE_IU AS LOJA,
               TI041_SERIE_IU AS PDV,
               SUM(TI041_VALOR_TOTAL_NOTA_FISCAL) AS VALOR_TOTAL
        FROM TI041_NF_SAIDA
        WHERE TI041_DATA_EMISSAO_IU = TO_DATE(:data, 'YYYY-MM-DD')
          AND TI041_UNIDADE_IU = ${cdLoja}
          AND TI041_TIPO_NOTA_FISCAL_IU = 'K'
          AND TI041_SISTEMA_DESTINO_IE = 22
          AND TI041_OPERACAO_REGISTRO = 'I'
        GROUP BY TI041_DATA_EMISSAO_IU, TI041_UNIDADE_IU, TI041_SERIE_IU
        ORDER BY TI041_SERIE_IU
      `;

      return await dataSource.query(query, [data]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }

  async nfTotal(dataInicial: string, dataFinal: string) {
    this.validarPeriodo(dataInicial, dataFinal);
    const dataSource = this.createDataSource();

    try {
      await dataSource.initialize();

      const query = `
        SELECT TI041_DATA_EMISSAO_IU AS DATA,
               SUM(TI041_VALOR_TOTAL_NOTA_FISCAL) AS VALOR_TOTAL
        FROM TI041_NF_SAIDA
        WHERE TI041_DATA_EMISSAO_IU BETWEEN TO_DATE(:dataIni, 'YYYY-MM-DD') AND TO_DATE(:dataFim, 'YYYY-MM-DD')
          AND TI041_TIPO_NOTA_FISCAL_IU = 'K'
          AND TI041_SISTEMA_DESTINO_IE = 22
          AND TI041_OPERACAO_REGISTRO = 'I'
        GROUP BY TI041_DATA_EMISSAO_IU
        ORDER BY TI041_DATA_EMISSAO_IU
      `;

      return await dataSource.query(query, [dataInicial, dataFinal]);
    } finally {
      if (dataSource.isInitialized) await dataSource.destroy();
    }
  }
}

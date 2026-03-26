import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db3Client } from '../db3.client';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';

@Processor('db3-relatorios')
export class Db3Processor {
  constructor(private readonly db3Client: Db3Client) {}

  @Process('vendas-resumo')
  async handleVendasResumo(job: Job) {
    const { dataIni, dataFim, segmentos, tipoEmpresa } = job.data as {
      dataIni: string;
      dataFim: string;
      segmentos?: string;
      tipoEmpresa: TipoEmpresaDb3;
    };

    let listaSegmentos: string[];

    if (segmentos && segmentos.trim().length > 0) {
      listaSegmentos = segmentos.split(',').map((s) => s.trim());
    } else {
      listaSegmentos = [
        '51', '52', '53', '54', '55', '56', '59', '61', '62', '63', '57', '27', '1', '10', '29',
      ];
    }

    job.log(`Iniciando DB3 ${tipoEmpresa}: ${listaSegmentos.length} segmentos (sequencial)`);
    await job.progress(5);

    const consolidado = new Map<string, number>();
    const totalSegmentos = listaSegmentos.length;

    for (let i = 0; i < totalSegmentos; i++) {
      const seg = listaSegmentos[i];

      job.log(`[${i + 1}/${totalSegmentos}] Processando segmento ${seg} - ${tipoEmpresa}...`);

      const resultados = await this.db3Client.consultarPorSegmento(
        dataIni,
        dataFim,
        seg,
        tipoEmpresa,
      );

      resultados.forEach((row: any) => {
        const data = row.DATA;
        const valor = parseFloat(row.VALOR || 0);

        if (consolidado.has(data)) {
          consolidado.set(data, consolidado.get(data)! + valor);
        } else {
          consolidado.set(data, valor);
        }
      });

      const progress = Math.round(((i + 1) / totalSegmentos) * 90) + 5;
      await job.progress(progress);
    }

    const registros = Array.from(consolidado.entries())
      .map(([data, valor]) => ({ DATA: data, VALOR: valor }))
      .sort((a, b) => {
        const [diaA, mesA, anoA] = a.DATA.split('/').map(Number);
        const [diaB, mesB, anoB] = b.DATA.split('/').map(Number);

        const dataA = new Date(anoA, mesA - 1, diaA).getTime();
        const dataB = new Date(anoB, mesB - 1, diaB).getTime();

        return dataA - dataB;
      });

    await job.progress(100);
    job.log(`Concluído ${tipoEmpresa}: ${registros.length} datas, ${totalSegmentos} segmentos processados`);

    return {
      database: 'DB3 - CONSINCO',
      tipoEmpresa,
      periodo: { inicio: dataIni, fim: dataFim },
      segmentos: listaSegmentos,
      registros,
      metodo: 'fila_sequencial',
    };
  }
}
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

    if (tipoEmpresa === 'GIGA') {
      return this.handleGigaPorHora(job, dataIni, dataFim, listaSegmentos);
    }

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

  private async handleGigaPorHora(
    job: Job,
    dataIni: string,
    dataFim: string,
    listaSegmentos: string[],
  ) {
    const { horaInicio, horaFim } = this.getFaixaHorariaAtual();
    const faixaHoras = {
      inicio: `${this.pad(horaInicio)}:00`,
      fim: `${this.pad(horaFim)}:00`,
    };

    if (dataIni !== dataFim) {
      job.log(
        `Aviso: consulta por hora usa apenas dataIni (${dataIni}). dataFim recebido: ${dataFim}`,
      );
    }

    if (horaFim <= horaInicio) {
      job.log('Nenhuma hora fechada a partir das 06:00 para consolidar.');
      await job.progress(100);

      return {
        database: 'DB3 - CONSINCO',
        tipoEmpresa: 'GIGA',
        periodo: { inicio: dataIni, fim: dataFim },
        segmentos: listaSegmentos,
        registros: [],
        metodo: 'fila_sequencial',
        granularidade: 'HORA',
        faixaHoras,
      };
    }

    const consolidado = new Map<number, number>();
    const totalSegmentos = listaSegmentos.length;

    for (let i = 0; i < totalSegmentos; i++) {
      const seg = listaSegmentos[i];

      job.log(`[${i + 1}/${totalSegmentos}] Processando segmento ${seg} - GIGA (hora)...`);

      const resultados = await this.db3Client.consultarPorSegmentoPorHora(
        dataIni,
        horaInicio,
        horaFim,
        seg,
        'GIGA',
      );

      resultados.forEach((row: any) => {
        const hora = Number(row.HORA);
        const valor = parseFloat(row.VALOR || 0);

        if (!Number.isNaN(hora)) {
          consolidado.set(hora, (consolidado.get(hora) ?? 0) + valor);
        }
      });

      const progress = Math.round(((i + 1) / totalSegmentos) * 90) + 5;
      await job.progress(progress);
    }

    const dataBr = this.formatDateBr(dataIni);
    const registros = [];

    for (let h = horaInicio; h < horaFim; h++) {
      registros.push({
        DATA: dataBr,
        HORA: `${this.pad(h)}:00-${this.pad(h + 1)}:00`,
        VALOR: consolidado.get(h) ?? 0,
      });
    }

    await job.progress(100);
    job.log(
      `Concluido GIGA: ${registros.length} faixas horarias, ${totalSegmentos} segmentos processados`,
    );

    return {
      database: 'DB3 - CONSINCO',
      tipoEmpresa: 'GIGA',
      periodo: { inicio: dataIni, fim: dataFim },
      segmentos: listaSegmentos,
      registros,
      metodo: 'fila_sequencial',
      granularidade: 'HORA',
      faixaHoras,
    };
  }

  private getFaixaHorariaAtual() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    const horaAtual = Number(map.hour);
    const horaInicio = 6;
    const horaFim = Number.isNaN(horaAtual) ? horaInicio : horaAtual;

    return { horaInicio, horaFim };
  }

  private formatDateBr(dataIso: string) {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private pad(valor: number) {
    return valor.toString().padStart(2, '0');
  }
}

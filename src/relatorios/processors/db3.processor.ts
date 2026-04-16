import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Db3Client } from '../db3.client';

type TipoEmpresaDb3 = 'MERCANTIL' | 'GIGA';
type RegistroHoraDb3 = {
  DATA: string;
  HORA: string;
  VALOR: number;
};
type LojaGigaDb3 = {
  codigo: number;
  nome: string;
  nomeReduzido: string | null;
};
type SegmentoGigaDb3 = {
  codigo: number;
  descricao: string;
  status: string | null;
};
type ResultadoGigaDb3 = {
  database: string;
  tipoEmpresa: 'GIGA';
  periodo: { inicio: string; fim: string };
  segmentos: string[];
  criterioEmpresas: 'cadastro_giga_ativo';
  criterioValor: 'vlritemsemdesc_menos_vlrdevolitemsemdesc';
  segmentosDetalhados: SegmentoGigaDb3[];
  lojas: LojaGigaDb3[];
  registros: RegistroHoraDb3[];
  totalDia: number;
  metodo: 'consulta_unica';
  granularidade: 'HORA';
  faixaHoras: { inicio: string; fim: string };
};

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
        '51', '52', '53', '54', '55', '56', '59', '61', '62', '63', '57', '27', '1', '10', '29', '24',
      ];
    }

    job.log(
      tipoEmpresa === 'GIGA'
        ? `Iniciando DB3 GIGA: ${listaSegmentos.length} segmentos (consulta unica por hora)`
        : `Iniciando DB3 ${tipoEmpresa}: ${listaSegmentos.length} segmentos (sequencial)`,
    );
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
  ): Promise<ResultadoGigaDb3> {
    const { horaInicioConsulta, horaFimConsulta, faixaFimLabel } =
      this.getFaixaHorariaConsulta(dataIni);

    if (dataIni !== dataFim) {
      job.log(
        `Aviso: consulta por hora usa apenas dataIni (${dataIni}). dataFim recebido: ${dataFim}`,
      );
    }

    const [lojas, segmentosDetalhados] = await Promise.all([
      this.listarLojasGiga(),
      this.listarSegmentosGiga(listaSegmentos),
    ]);

    const consolidado = new Map<number, number>();
    const totalSegmentos = listaSegmentos.length;
    job.log(
      `Consultando GIGA por hora em lote unico para ${totalSegmentos} segmentos...`,
    );
    await job.progress(25);

    const resultados = await this.db3Client.consultarPorSegmentosPorHora(
      dataIni,
      horaInicioConsulta,
      horaFimConsulta,
      listaSegmentos,
      'GIGA',
    );

    resultados.forEach((row: any) => {
      const hora = Number(row.HORA);
      const valor = parseFloat(row.VALOR || 0);

      if (!Number.isNaN(hora)) {
        consolidado.set(hora, (consolidado.get(hora) ?? 0) + valor);
      }
    });

    await job.progress(90);

    const dataBr = this.formatDateBr(dataIni);
    const horasComVenda = Array.from(consolidado.keys()).sort((a, b) => a - b);
    const horaInicioFaixa =
      horasComVenda.length > 0 ? horasComVenda[0] : horaInicioConsulta;
    const horaFimFaixa = Math.max(horaInicioFaixa, horaFimConsulta);
    const faixaHoras = {
      inicio: `${this.pad(horaInicioFaixa)}:00`,
      fim: faixaFimLabel,
    };

    if (horasComVenda.length === 0) {
      job.log('Nenhuma venda encontrada no intervalo consultado.');
      await job.progress(100);

      return {
        database: 'DB3 - CONSINCO',
        tipoEmpresa: 'GIGA',
        periodo: { inicio: dataIni, fim: dataFim },
        segmentos: listaSegmentos,
        criterioEmpresas: 'cadastro_giga_ativo',
        criterioValor: 'vlritemsemdesc_menos_vlrdevolitemsemdesc',
        segmentosDetalhados,
        lojas,
        registros: [],
        totalDia: 0,
        metodo: 'consulta_unica',
        granularidade: 'HORA',
        faixaHoras,
      };
    }

    const registros: RegistroHoraDb3[] = [];

    for (let h = horaInicioFaixa; h < horaFimFaixa; h++) {
      const horaFimLabel =
        h === 23 && horaFimFaixa === 24 ? '23:59' : `${this.pad(h + 1)}:00`;

      registros.push({
        DATA: dataBr,
        HORA: `${this.pad(h)}:00-${horaFimLabel}`,
        VALOR: consolidado.get(h) ?? 0,
      });
    }

    const totalDia = registros.reduce((total, registro) => total + registro.VALOR, 0);

    await job.progress(100);
    job.log(
      `Concluido GIGA: ${registros.length} faixas horarias, ${totalSegmentos} segmentos processados`,
    );

    return {
      database: 'DB3 - CONSINCO',
      tipoEmpresa: 'GIGA',
      periodo: { inicio: dataIni, fim: dataFim },
      segmentos: listaSegmentos,
      criterioEmpresas: 'cadastro_giga_ativo',
      criterioValor: 'vlritemsemdesc_menos_vlrdevolitemsemdesc',
      segmentosDetalhados,
      lojas,
      registros,
      totalDia,
      metodo: 'consulta_unica',
      granularidade: 'HORA',
      faixaHoras,
    };
  }

  private getTodayFortalezaIso() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    return `${map.year}-${map.month}-${map.day}`;
  }

  private getHoraAtualFortaleza() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const map = Object.fromEntries(
      parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
    ) as Record<string, string>;

    return Number(map.hour);
  }

  private getFaixaHorariaConsulta(dataReferencia: string) {
    const hoje = this.getTodayFortalezaIso();

    if (dataReferencia < hoje) {
      return {
        horaInicioConsulta: 0,
        horaFimConsulta: 24,
        faixaFimLabel: '23:59',
      };
    }

    if (dataReferencia > hoje) {
      return {
        horaInicioConsulta: 0,
        horaFimConsulta: 0,
        faixaFimLabel: '00:00',
      };
    }

    const horaAtual = this.getHoraAtualFortaleza();
    const horaFimConsulta = Number.isNaN(horaAtual) ? 0 : Math.min(horaAtual + 1, 24);

    return {
      horaInicioConsulta: 0,
      horaFimConsulta,
      faixaFimLabel: horaFimConsulta === 24 ? '23:59' : `${this.pad(horaFimConsulta)}:00`,
    };
  }

  private formatDateBr(dataIso: string) {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private pad(valor: number) {
    return valor.toString().padStart(2, '0');
  }

  private async listarLojasGiga(): Promise<LojaGigaDb3[]> {
    const lojas = await this.db3Client.listarEmpresasPorFaixa('GIGA');

    return lojas.map((loja: any) => ({
      codigo: Number(loja.CODIGO),
      nome: String(loja.NOME ?? loja.NOME_REDUZIDO ?? loja.CODIGO),
      nomeReduzido: loja.NOME_REDUZIDO ? String(loja.NOME_REDUZIDO) : null,
    }));
  }

  private async listarSegmentosGiga(segmentos: string[]): Promise<SegmentoGigaDb3[]> {
    const segmentosDetalhados = await this.db3Client.listarSegmentosDetalhados(segmentos);

    return segmentosDetalhados.map((segmento: any) => ({
      codigo: Number(segmento.CODIGO),
      descricao: String(segmento.DESCRICAO ?? segmento.CODIGO),
      status: segmento.STATUS ? String(segmento.STATUS) : null,
    }));
  }
}

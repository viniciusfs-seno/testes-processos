import { Controller, Post, Get, Body, Param, Header } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { Db1CnsdResumoDto } from './dto/db1-cnsd-resumo.dto';
import { Db2VendasResumoDto } from './dto/db2-vendas-resumo.dto';
import { Db3VendasResumoDto } from './dto/db3-vendas-resumo.dto';
import { Db4VendasResumoDto } from './dto/db4-vendas-resumo.dto';
import { Db4VendasDetalheDto } from './dto/db4-vendas-detalhe.dto';
import { Db4VendasTotalDto } from './dto/db4-vendas-total.dto';
import { Db5NfResumoDto } from './dto/db5-nf-resumo.dto';
import { Db5NfDetalheDto } from './dto/db5-nf-detalhe.dto';
import { Db5NfTotalDto } from './dto/db5-nf-total.dto';
import { RelatorioSubidaVendasDto } from './dto/relatorio-subida-vendas.dto';
import { relatorioSubidaVendasHtml } from './relatorio-subida-vendas.ui';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  // Relatorio Subida de Vendas
  @Post('relatorio-subida-vendas')
  async relatorioSubidaVendas(@Body() dto: RelatorioSubidaVendasDto) {
    return this.service.relatorioSubidaVendas(dto);
  }

  @Post('relatorio-subida-vendas/giga')
  async relatorioSubidaVendasGiga(@Body() dto: RelatorioSubidaVendasDto) {
    return this.service.relatorioSubidaVendasGiga(dto);
  }

  @Get('relatorio-subida-vendas/ultimo')
  async ultimoRelatorioSubidaVendas() {
    return this.service.getUltimoRelatorioSubidaVendas();
  }

  @Get('relatorio-subida-vendas/ui')
  @Header('Content-Type', 'text/html; charset=utf-8')
  relatorioSubidaVendasUi() {
    return relatorioSubidaVendasHtml;
  }

  // ─── DB1 ─────────────────────────────────────────────────────────────────────
  @Post('db1/cnsd-resumo')
  async cnsdResumo(@Body() dto: Db1CnsdResumoDto) {
    return this.service.resumoDb1Cnsd(dto);
  }

  // ─── DB2 ─────────────────────────────────────────────────────────────────────
  @Post('db2/vendas-resumo')
  async vendasEmporiumResumo(@Body() dto: Db2VendasResumoDto) {
    return this.service.resumoDb2Vendas(dto);
  }

  // ─── DB3 ─────────────────────────────────────────────────────────────────────
  @Post('db3/vendas-resumo-mercantil')
  async vendasConsincoResumoMercantil(@Body() dto: Db3VendasResumoDto) {
    return this.service.resumoDb3VendasMercantil(dto);
  }

  @Post('db3/vendas-resumo-giga')
  async vendasConsincoResumoGiga(@Body() dto: Db3VendasResumoDto) {
    return this.service.resumoDb3VendasGiga(dto);
  }

  // ─── DB4 ─────────────────────────────────────────────────────────────────────
  @Post('db4/vendas-resumo')
  async vendasFarmaciasResumo(@Body() dto: Db4VendasResumoDto) {
    return this.service.resumoDb4Vendas(dto);
  }

  @Post('db4/vendas-detalhe')
  async vendasFarmaciasDetalhe(@Body() dto: Db4VendasDetalheDto) {
    return this.service.detalheDb4Vendas(dto);
  }

  @Post('db4/vendas-total')
  async vendasFarmaciasTotal(@Body() dto: Db4VendasTotalDto) {
    return this.service.totalDb4Vendas(dto);
  }

  // ─── DB5 ─────────────────────────────────────────────────────────────────────
  @Post('db5/nf-resumo')
  async nfMdlogResumo(@Body() dto: Db5NfResumoDto) {
    return this.service.resumoDb5Nf(dto);
  }

  @Post('db5/nf-detalhe')
  async nfMdlogDetalhe(@Body() dto: Db5NfDetalheDto) {
    return this.service.detalheDb5Nf(dto);
  }

  @Post('db5/nf-total')
  async nfMdlogTotal(@Body() dto: Db5NfTotalDto) {
    return this.service.totalDb5Nf(dto);
  }

  // ─── Status ──────────────────────────────────────────────────────────────────
  @Get('job/:queue/:id')
  async getJobStatusByQueue(
    @Param('queue') queue: string,
    @Param('id') id: string,
  ) {
    return this.service.getJobStatusByQueue(queue, id);
  }

  @Get('job/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.service.getJobStatus(id);
  }
}

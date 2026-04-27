import { gigaValidacaoHtml } from './giga-validacao.ui';
import { relatorioSubidaVendasFinalHtml } from './relatorio-subida-vendas-final.ui';
import { relatorioSubidaVendasHtml } from './relatorio-subida-vendas.ui';

describe('relatorioSubidaVendasHtml', () => {
  it('expoe o botao para abrir o relatorio final, feedback de geracao e nao mostra botoes dedicados de giga', () => {
    expect(relatorioSubidaVendasHtml).toContain('btnAbrirFinal');
    expect(relatorioSubidaVendasHtml).toContain('actionFeedback');
    expect(relatorioSubidaVendasHtml).toContain('allJobsCompletedSuccessfully');
    expect(relatorioSubidaVendasHtml).toContain('Gerando...');
    expect(relatorioSubidaVendasHtml).toContain('Verifique a conexao com Redis/filas.');
    expect(relatorioSubidaVendasHtml).toContain('/relatorios/relatorio-subida-vendas/final');
    expect(relatorioSubidaVendasHtml).not.toContain('btnGerarGigaLiquida');
    expect(relatorioSubidaVendasHtml).not.toContain('btnGerarGigaBruta');
    expect(relatorioSubidaVendasHtml).not.toContain('btnGerarGigaRdp');
  });
});

describe('relatorioSubidaVendasFinalHtml', () => {
  it('expoe seletor de tema e endpoint de dados do relatorio final', () => {
    expect(relatorioSubidaVendasFinalHtml).toContain('themeSelect');
    expect(relatorioSubidaVendasFinalHtml).toContain('principal');
    expect(relatorioSubidaVendasFinalHtml).toContain('escuro');
    expect(relatorioSubidaVendasFinalHtml).toContain('azul');
    expect(relatorioSubidaVendasFinalHtml).toContain('/relatorios/relatorio-subida-vendas/final/data');
    expect(relatorioSubidaVendasFinalHtml).toContain('data-manual-sap');
    expect(relatorioSubidaVendasFinalHtml).toContain('SAP_STORAGE_PREFIX');
    expect(relatorioSubidaVendasFinalHtml).toContain('buildComparativoSection');
    expect(relatorioSubidaVendasFinalHtml).toContain('Colar SAP');
    expect(relatorioSubidaVendasFinalHtml).toContain('parseBrCurrency');
    expect(relatorioSubidaVendasFinalHtml).toContain('navigator.clipboard.readText');
    expect(relatorioSubidaVendasFinalHtml).toContain('applySapValuesToInputs');
    expect(relatorioSubidaVendasFinalHtml).toContain('data-paste-feedback');
    expect(relatorioSubidaVendasFinalHtml).toContain('Nao foi possivel ler a area de transferencia do navegador.');
    expect(relatorioSubidaVendasFinalHtml).toContain('data-manual-total');
    expect(relatorioSubidaVendasFinalHtml).toContain('data-manual-total-row');
    expect(relatorioSubidaVendasFinalHtml).toContain('percentualDiferencaTotal');
    expect(relatorioSubidaVendasFinalHtml).toContain('minimumFractionDigits: 2');
    expect(relatorioSubidaVendasFinalHtml).toContain('maximumFractionDigits: 2');
    expect(relatorioSubidaVendasFinalHtml).toContain('diferenca / totals.totalEmporium');
    expect(relatorioSubidaVendasFinalHtml).toContain('diff / emporiumValue');
    expect(relatorioSubidaVendasFinalHtml).toContain('Total atual');
    expect(relatorioSubidaVendasFinalHtml).toContain('updateManualSapSummary');
    expect(relatorioSubidaVendasFinalHtml).toContain('DIFERENCA_%');
    expect(relatorioSubidaVendasFinalHtml).toContain('buildGigaSpotlight');
    expect(relatorioSubidaVendasFinalHtml).not.toContain('id="sections"');
  });
});

describe('gigaValidacaoHtml', () => {
  it('expoe endpoint de dados e blocos da validacao de giga', () => {
    expect(gigaValidacaoHtml).toContain('Validacao GIGA');
    expect(gigaValidacaoHtml).toContain('/relatorios/giga-validacao/data');
    expect(gigaValidacaoHtml).toContain('loadingState');
    expect(gigaValidacaoHtml).toContain('setLoadingState');
    expect(gigaValidacaoHtml).toContain('Carregando validacao de GIGA...');
    expect(gigaValidacaoHtml).toContain('Falha ao carregar a validacao de GIGA. Tente novamente.');
    expect(gigaValidacaoHtml).toContain('Universo completo de segmentos');
    expect(gigaValidacaoHtml).toContain('Lojas padrao RDP');
    expect(gigaValidacaoHtml).toContain('Segmentos padrao RDP');
    expect(gigaValidacaoHtml).toContain('Catalogo de colunas');
  });
});

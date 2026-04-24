export const gigaValidacaoHtml = `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Validacao GIGA</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --card: #ffffff;
        --ink: #1f2937;
        --muted: #6b7280;
        --line: #dbe2ea;
        --accent: #1d4ed8;
        --accent-soft: rgba(29, 78, 216, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 35%);
        color: var(--ink);
      }
      .wrap { max-width: 1400px; margin: 0 auto; padding: 24px; }
      .hero, .panel, .criterion {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }
      .hero { padding: 24px; margin-bottom: 20px; }
      .hero h1 { margin: 0 0 10px; font-size: 38px; }
      .hero p { margin: 0; color: var(--muted); max-width: 820px; }
      .controls { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
      .controls input, .controls button {
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 12px 14px;
        font: inherit;
      }
      .controls button {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
        cursor: pointer;
      }
      .controls button:disabled {
        opacity: 0.7;
        cursor: wait;
      }
      .loading-state {
        margin-top: 16px;
        display: none;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid #bfdbfe;
        background: #eff6ff;
        color: #1e3a8a;
      }
      .loading-state.active {
        display: flex;
      }
      .loading-spinner {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        border: 2px solid rgba(30, 64, 175, 0.2);
        border-top-color: #1d4ed8;
        animation: giga-spin 0.8s linear infinite;
        flex: 0 0 auto;
      }
      .loading-state.error {
        display: flex;
        border-color: #fecaca;
        background: #fef2f2;
        color: #991b1b;
      }
      .loading-state.error .loading-spinner {
        display: none;
      }
      @keyframes giga-spin {
        to { transform: rotate(360deg); }
      }
      .meta, .summary-grid, .criterion-grid, .split-grid { display: grid; gap: 16px; }
      .meta { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 18px; }
      .panel { padding: 20px; margin-bottom: 18px; }
      .summary-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .card {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 16px;
        background: #fbfdff;
      }
      .card small {
        display: block;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 8px;
      }
      .card strong { font-size: 28px; display: block; }
      .criterion { padding: 20px; margin-bottom: 20px; }
      .criterion-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip {
        background: var(--accent-soft);
        color: var(--accent);
        border-radius: 999px;
        padding: 8px 10px;
        font-size: 13px;
      }
      .criterion-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 16px;
      }
      .split-grid {
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        margin-top: 14px;
      }
      .table-wrap {
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 520px;
      }
      th, td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        white-space: nowrap;
      }
      th {
        background: #f8fbff;
        color: var(--muted);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.06em;
      }
      td.numeric, th.numeric { text-align: right; }
      .doc-list { display: grid; gap: 12px; }
      .doc-item {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px;
      }
      .warning {
        color: #92400e;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 14px;
        padding: 12px 14px;
        margin-top: 14px;
      }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <h1>Validacao GIGA</h1>
        <p>
          Painel tecnico para comparar as consultas LIQUIDA, BRUTA e RDP_SIMILAR,
          conferir lojas e segmentos com/sem venda e revisar as colunas envolvidas.
        </p>
        <div class="controls">
          <input type="date" id="dataIni" />
          <input type="date" id="dataFim" />
          <button id="btnCarregar" type="button">Atualizar validacao</button>
        </div>
        <div class="loading-state" id="loadingState" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <strong id="loadingText">Carregando validacao de GIGA...</strong>
        </div>
        <div class="meta" id="meta"></div>
        <div id="observacoes"></div>
      </section>

      <section class="panel">
        <h2>Resumo geral</h2>
        <div class="summary-grid" id="summary"></div>
      </section>

      <section id="criterios"></section>

      <section class="panel">
        <h2>Universo completo de segmentos</h2>
        <div class="table-wrap" id="segmentosPossiveis"></div>
      </section>

      <section class="panel">
        <h2>Catalogo de colunas</h2>
        <div class="doc-list" id="catalogo"></div>
      </section>

      <section class="panel">
        <h2>Documentacao resumida</h2>
        <div class="doc-list" id="documentacao"></div>
      </section>
    </main>

    <script>
      (function () {
        const api = { data: '/relatorios/giga-validacao/data' };

        function byId(id) {
          return document.getElementById(id);
        }

        function formatNow() {
          const now = new Date();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return now.getFullYear() + '-' + month + '-' + day;
        }

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function formatNumber(value) {
          if (!Number.isFinite(Number(value))) return '--';
          return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(Number(value));
        }

        function buildCard(title, value, subtitle) {
          return '<article class="card"><small>' + escapeHtml(title) + '</small><strong>' + escapeHtml(value) + '</strong><div class="muted">' + escapeHtml(subtitle || '') + '</div></article>';
        }

        function buildTable(columns, rows) {
          return '<table><thead><tr>' +
            columns.map(function (column) {
              return '<th class="' + (column.numeric ? 'numeric' : '') + '">' + escapeHtml(column.label) + '</th>';
            }).join('') +
            '</tr></thead><tbody>' +
            rows.map(function (row) {
              return '<tr>' + columns.map(function (column) {
                const value = row[column.key];
                return '<td class="' + (column.numeric ? 'numeric' : '') + '">' + escapeHtml(column.numeric ? formatNumber(value) : String(value ?? '--')) + '</td>';
              }).join('') + '</tr>';
            }).join('') +
            '</tbody></table>';
        }

        function setLoadingState(mode, message) {
          const state = byId('loadingState');
          const text = byId('loadingText');
          const button = byId('btnCarregar');
          const normalizedMode = mode || 'idle';

          state.classList.remove('active', 'error');
          button.disabled = normalizedMode === 'loading';

          if (normalizedMode === 'loading') {
            state.classList.add('active');
            text.textContent = message || 'Carregando validacao de GIGA...';
            return;
          }

          if (normalizedMode === 'error') {
            state.classList.add('error');
            text.textContent = message || 'Nao foi possivel carregar a validacao de GIGA.';
            return;
          }

          text.textContent = message || 'Carregando validacao de GIGA...';
        }

        function renderMeta(data) {
          byId('meta').innerHTML = [
            buildCard('Periodo', (data.periodo && data.periodo.inicio ? data.periodo.inicio : '--') + ' ate ' + (data.periodo && data.periodo.fim ? data.periodo.fim : '--'), 'Periodo solicitado'),
            buildCard('Referencia de consulta', data.periodo && data.periodo.referenciaConsulta ? data.periodo.referenciaConsulta : '--', 'GIGA por hora usa dataIni'),
            buildCard('Lojas padrao RDP', formatNumber((data.lojasPadraoRdp || []).length), 'Universo explicito usado no relatorio'),
            buildCard('Segmentos padrao RDP', formatNumber((data.segmentosPadraoRdp || []).length), 'Seis segmentos de referencia do RDP'),
          ].join('');

          const observacoes = Array.isArray(data.observacoes) ? data.observacoes : [];
          byId('observacoes').innerHTML = observacoes.map(function (item) {
            return '<div class="warning">' + escapeHtml(item) + '</div>';
          }).join('');
        }

        function renderSummary(data) {
          const criterios = Array.isArray(data.criterios) ? data.criterios : [];
          byId('summary').innerHTML = criterios.map(function (criterio) {
            return buildCard(
              criterio.tipoConsulta,
              formatNumber(criterio.totalPeriodo),
              'Faixas: ' + formatNumber((criterio.registros || []).length) +
              ' | Lojas com venda: ' + formatNumber((criterio.lojasComVenda || []).length)
            );
          }).join('');
        }

        function renderCriterios(data) {
          const criterios = Array.isArray(data.criterios) ? data.criterios : [];
          byId('criterios').innerHTML = criterios.map(function (criterio) {
            const registros = buildTable(
              [
                { key: 'DATA', label: 'Data' },
                { key: 'HORA', label: 'Hora' },
                { key: 'VALOR', label: 'Valor', numeric: true },
              ],
              criterio.registros || []
            );

            const lojasComVenda = buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'nome', label: 'Nome' },
                { key: 'nomeReduzido', label: 'Nome reduzido' },
                { key: 'totalVenda', label: 'Venda', numeric: true },
              ],
              criterio.lojasComVenda || []
            );

            const lojasSemVenda = buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'nome', label: 'Nome' },
                { key: 'nomeReduzido', label: 'Nome reduzido' },
              ],
              criterio.lojasSemVenda || []
            );

            const segmentosComVenda = buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'descricao', label: 'Descricao' },
                { key: 'status', label: 'Status' },
                { key: 'totalVenda', label: 'Venda', numeric: true },
              ],
              criterio.segmentosComVenda || []
            );

            const segmentosSemVenda = buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'descricao', label: 'Descricao' },
                { key: 'status', label: 'Status' },
              ],
              criterio.segmentosSemVenda || []
            );

            return '<section class="criterion">' +
              '<div class="criterion-head">' +
                '<div><h2>' + escapeHtml(criterio.tipoConsulta) + '</h2><p class="muted">' + escapeHtml(criterio.criterioValor) + ' | ' + escapeHtml(criterio.dataHoraVendaExpr) + '</p></div>' +
                '<div class="chips">' +
                  '<span class="chip">Total: ' + escapeHtml(formatNumber(criterio.totalPeriodo)) + '</span>' +
                  '<span class="chip">Faixa: ' + escapeHtml((criterio.faixaHoras && criterio.faixaHoras.inicio ? criterio.faixaHoras.inicio : '--') + ' ate ' + (criterio.faixaHoras && criterio.faixaHoras.fim ? criterio.faixaHoras.fim : '--')) + '</span>' +
                  '<span class="chip">Segmentos usados: ' + escapeHtml(formatNumber((criterio.segmentosElegiveis || []).length)) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="criterion-grid">' +
                buildCard('Lojas elegiveis', formatNumber((criterio.lojasElegiveis || []).length), 'Universo de lojas GIGA') +
                buildCard('Lojas com venda', formatNumber((criterio.lojasComVenda || []).length), 'Lojas com valor no periodo') +
                buildCard('Segmentos com venda', formatNumber((criterio.segmentosComVenda || []).length), 'Entre os segmentos usados') +
                buildCard('Segmentos sem venda', formatNumber((criterio.segmentosSemVenda || []).length), 'Entre os segmentos usados') +
              '</div>' +
              '<div class="split-grid">' +
                '<div class="panel"><h3>Faixas horarias</h3><div class="table-wrap">' + registros + '</div></div>' +
                '<div class="panel"><h3>Lojas com venda</h3><div class="table-wrap">' + lojasComVenda + '</div></div>' +
                '<div class="panel"><h3>Lojas sem venda</h3><div class="table-wrap">' + lojasSemVenda + '</div></div>' +
                '<div class="panel"><h3>Segmentos com venda</h3><div class="table-wrap">' + segmentosComVenda + '</div></div>' +
                '<div class="panel"><h3>Segmentos sem venda</h3><div class="table-wrap">' + segmentosSemVenda + '</div></div>' +
              '</div>' +
            '</section>';
          }).join('');
        }

        function renderSegmentosPossiveis(data) {
          const table = buildTable(
            [
              { key: 'codigo', label: 'Codigo' },
              { key: 'descricao', label: 'Descricao' },
              { key: 'status', label: 'Status' },
              { key: 'estaNoConjuntoPadrao', label: 'No padrao' },
              { key: 'teveVendaEmAlgumCriterio', label: 'Teve venda' },
            ],
            data.segmentosPossiveis || []
          );
          byId('segmentosPossiveis').innerHTML = table;
        }

        function renderCatalogo(data) {
          const catalogo = data.catalogoColunas || {};
          byId('catalogo').innerHTML = [
            { title: 'Tabelas inspecionadas', rows: (catalogo.tabelasInspecionadas || []).map(function (item) { return { nome: item }; }), columns: [{ key: 'nome', label: 'Tabela' }] },
            { title: 'Colunas de valor', rows: catalogo.colunasValor || [], columns: [{ key: 'TABLE_NAME', label: 'Tabela' }, { key: 'COLUMN_NAME', label: 'Coluna' }, { key: 'DATA_TYPE', label: 'Tipo' }] },
            { title: 'Colunas de data/hora', rows: catalogo.colunasDataHora || [], columns: [{ key: 'TABLE_NAME', label: 'Tabela' }, { key: 'COLUMN_NAME', label: 'Coluna' }, { key: 'DATA_TYPE', label: 'Tipo' }] },
            { title: 'Colunas de empresa', rows: catalogo.colunasEmpresa || [], columns: [{ key: 'TABLE_NAME', label: 'Tabela' }, { key: 'COLUMN_NAME', label: 'Coluna' }, { key: 'DATA_TYPE', label: 'Tipo' }] },
            { title: 'Colunas de segmento', rows: catalogo.colunasSegmento || [], columns: [{ key: 'TABLE_NAME', label: 'Tabela' }, { key: 'COLUMN_NAME', label: 'Coluna' }, { key: 'DATA_TYPE', label: 'Tipo' }] },
            { title: 'Colunas de join/filtro', rows: catalogo.colunasJoinFiltro || [], columns: [{ key: 'TABLE_NAME', label: 'Tabela' }, { key: 'COLUMN_NAME', label: 'Coluna' }, { key: 'DATA_TYPE', label: 'Tipo' }] },
          ].map(function (block) {
            return '<article class="doc-item"><h3>' + escapeHtml(block.title) + '</h3><div class="table-wrap">' + buildTable(block.columns, block.rows) + '</div></article>';
          }).join('');
        }

        function renderDocumentacao(data) {
          const doc = data.documentacaoResumo || {};
          const criterios = Array.isArray(doc.criterios) ? doc.criterios : [];
          const achados = Array.isArray(doc.achados) ? doc.achados : [];
          byId('documentacao').innerHTML =
            '<article class="doc-item"><h3>Arquivo versionado</h3><p class="muted">' + escapeHtml(doc.arquivoMarkdown || '--') + '</p></article>' +
            '<article class="doc-item"><h3>Criterios</h3><div class="table-wrap">' + buildTable(
              [
                { key: 'tipoConsulta', label: 'Consulta' },
                { key: 'criterioValor', label: 'Criterio' },
                { key: 'dataHoraVendaExpr', label: 'Data/hora' },
              ],
              criterios
            ) + '</div></article>' +
            '<article class="doc-item"><h3>Lojas padrao RDP</h3><div class="table-wrap">' + buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'nome', label: 'Nome' },
                { key: 'nomeReduzido', label: 'Nome reduzido' }
              ],
              doc.lojasPadraoRdp || []
            ) + '</div></article>' +
            '<article class="doc-item"><h3>Segmentos padrao RDP</h3><div class="table-wrap">' + buildTable(
              [
                { key: 'codigo', label: 'Codigo' },
                { key: 'descricao', label: 'Descricao' },
                { key: 'status', label: 'Status' }
              ],
              doc.segmentosPadraoRdp || []
            ) + '</div></article>' +
            '<article class="doc-item"><h3>Achados do banco</h3><div class="doc-list">' + achados.map(function (item) {
              return '<p class="muted">' + escapeHtml(item) + '</p>';
            }).join('') + '</div></article>' +
            '<article class="doc-item"><h3>Tabelas inspecionadas</h3><p class="muted">' + escapeHtml((doc.tabelasInspecionadas || []).join(', ')) + '</p></article>' +
            '<article class="doc-item"><h3>Filtros ainda ativos</h3><p class="muted">' + escapeHtml((doc.filtrosRelevantes || []).join(', ')) + '</p></article>';
        }

        async function load() {
          const dataIni = byId('dataIni').value || formatNow();
          const dataFim = byId('dataFim').value || dataIni;
          try {
            setLoadingState('loading', 'Carregando validacao de GIGA...');
            const response = await fetch(api.data + '?dataIni=' + encodeURIComponent(dataIni) + '&dataFim=' + encodeURIComponent(dataFim));
            if (!response.ok) {
              throw new Error('Falha ao consultar a API de validacao');
            }
            const data = await response.json();
            renderMeta(data);
            renderSummary(data);
            renderCriterios(data);
            renderSegmentosPossiveis(data);
            renderCatalogo(data);
            renderDocumentacao(data);
            setLoadingState('idle');
          } catch (error) {
            setLoadingState('error', 'Falha ao carregar a validacao de GIGA. Tente novamente.');
          }
        }

        byId('dataIni').value = formatNow();
        byId('dataFim').value = formatNow();
        byId('btnCarregar').addEventListener('click', load);
        load();
      })();
    </script>
  </body>
</html>
`;

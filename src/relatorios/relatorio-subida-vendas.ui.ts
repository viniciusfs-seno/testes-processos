export const relatorioSubidaVendasHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatorio Subida de Vendas</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg-1: #f6f1e6;
        --bg-2: #e3f3f1;
        --ink: #1f2a30;
        --muted: #5f6b73;
        --card: #ffffff;
        --accent: #ff7a59;
        --accent-2: #2a9d8f;
        --accent-3: #1d4e89;
        --shadow: 0 18px 60px rgba(0, 0, 0, 0.12);
        --radius: 16px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        color: var(--ink);
        background: radial-gradient(circle at top, var(--bg-1) 0%, #fdfbf6 35%, var(--bg-2) 100%);
        min-height: 100vh;
      }

      .wrap {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 24px 64px;
      }

      .hero {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
        border-radius: 24px;
        background: linear-gradient(120deg, rgba(255, 122, 89, 0.14), rgba(42, 157, 143, 0.12));
        border: 1px solid rgba(31, 42, 48, 0.08);
        box-shadow: var(--shadow);
        animation: fadeUp 0.6s ease;
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(28px, 3vw, 38px);
        letter-spacing: -0.02em;
      }

      .hero p {
        margin: 0;
        color: var(--muted);
        max-width: 700px;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 14px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(31, 42, 48, 0.08);
      }

      .controls {
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }

      .controls input {
        border: 1px solid rgba(31, 42, 48, 0.2);
        border-radius: 10px;
        padding: 10px 12px;
        font-family: inherit;
        background: #fff;
      }

      .controls button {
        border: none;
        border-radius: 12px;
        padding: 12px 18px;
        font-family: inherit;
        font-weight: 600;
        background: var(--accent-3);
        color: #fff;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 10px 30px rgba(29, 78, 137, 0.25);
      }

      .controls button:hover {
        transform: translateY(-2px);
      }

      .controls button.secondary {
        background: #fff;
        color: var(--accent-3);
        border: 1px solid rgba(29, 78, 137, 0.18);
        box-shadow: none;
      }

      .error-box {
        border-radius: 12px;
        padding: 12px;
        background: rgba(205, 61, 74, 0.08);
        border: 1px solid rgba(205, 61, 74, 0.18);
        color: #8f2430;
        font-size: 13px;
      }

      .logs-panel {
        margin-top: 24px;
        padding: 20px;
        border-radius: 18px;
        background: rgba(15, 26, 34, 0.96);
        color: #e8f0f7;
        box-shadow: var(--shadow);
      }

      .logs-panel[hidden] {
        display: none;
      }

      .logs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      .log-card {
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 14px;
      }

      .log-card h4 {
        margin: 0 0 8px;
        font-size: 15px;
      }

      .log-list {
        margin: 12px 0 0;
        padding-left: 18px;
        color: #d0dce7;
        font-size: 12px;
      }

      .log-list li + li {
        margin-top: 6px;
      }

      .status-bar {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        color: var(--muted);
      }

      .overview {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }

      .metric {
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(31, 42, 48, 0.08);
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 12px 30px rgba(31, 42, 48, 0.08);
      }

      .metric strong {
        display: block;
        font-size: 28px;
        margin-top: 8px;
      }

      .result-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        font-size: 13px;
      }

      .result-chip {
        border-radius: 12px;
        padding: 8px 10px;
        background: rgba(31, 42, 48, 0.05);
      }

      .result-title {
        font-size: 13px;
        color: var(--muted);
      }

      .progress-block {
        display: grid;
        gap: 6px;
      }

      .progress-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: var(--muted);
      }

      .progress-track {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: rgba(31, 42, 48, 0.1);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent-3), var(--accent-2));
        transition: width 0.25s ease;
      }

      .preview-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .preview-table th,
      .preview-table td {
        padding: 8px 6px;
        border-bottom: 1px solid rgba(31, 42, 48, 0.08);
        text-align: left;
        vertical-align: top;
      }

      .preview-wrap {
        overflow-x: auto;
        border-radius: 12px;
        background: rgba(31, 42, 48, 0.03);
        padding: 8px;
      }

      .grid {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .card {
        background: var(--card);
        padding: 18px;
        border-radius: var(--radius);
        border: 1px solid rgba(31, 42, 48, 0.08);
        box-shadow: 0 12px 30px rgba(31, 42, 48, 0.08);
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 220px;
        animation: fadeUp 0.45s ease;
      }

      .card h3 {
        margin: 0;
        font-size: 18px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
        background: rgba(31, 42, 48, 0.08);
      }

      .badge.ok {
        background: rgba(42, 157, 143, 0.2);
        color: #1a6b63;
      }

      .badge.run {
        background: rgba(255, 122, 89, 0.2);
        color: #b6462c;
      }

      .badge.wait {
        background: rgba(29, 78, 137, 0.18);
        color: #1d4e89;
      }

      .badge.bad {
        background: rgba(205, 61, 74, 0.18);
        color: #a32f3b;
      }

      .mono {
        font-family: "SFMono-Regular", ui-monospace, monospace;
        font-size: 12px;
        color: var(--muted);
      }

      details {
        margin-top: auto;
      }

      details summary {
        cursor: pointer;
        font-weight: 600;
        color: var(--accent-3);
      }

      pre {
        background: #0f1a22;
        color: #e8f0f7;
        padding: 12px;
        border-radius: 12px;
        overflow-x: auto;
        font-size: 12px;
      }

      .empty {
        padding: 24px;
        border-radius: 16px;
        background: rgba(31, 42, 48, 0.05);
        color: var(--muted);
      }

      @media (max-width: 720px) {
        .controls {
          flex-direction: column;
          align-items: stretch;
        }
        .controls button {
          width: 100%;
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <h1>Relatorio Subida de Vendas</h1>
        <p>
          Tela simples para acompanhar o ultimo relatorio disparado e ver o status
          dos jobs em tempo quase real.
        </p>
        <div class="meta" id="meta">
          <span class="pill" id="meta-run">Nenhum relatorio registrado</span>
          <span class="pill" id="meta-period">Periodo: --</span>
        </div>
        <div class="controls">
          <input type="date" id="dataIni" />
          <input type="date" id="dataFim" />
          <button id="btnGerar">Gerar relatorio</button>
          <button id="btnGerarGiga" type="button">Puxar so GIGA</button>
          <button id="btnAtualizar" class="secondary" type="button">Atualizar resultados</button>
          <button id="btnLogs" class="secondary" type="button">Ver logs do ultimo relatorio</button>
        </div>
      </section>

      <div class="status-bar">
        <span id="lastUpdate">Ultima atualizacao: --</span>
        <span id="jobCount">Jobs: 0</span>
        <span id="refreshMode">Atualizacao automatica: ativa</span>
      </div>

      <section class="overview" id="overview"></section>
      <section class="logs-panel" id="logsPanel" hidden>
        <strong>Logs do ultimo relatorio</strong>
        <div class="logs-grid" id="logsGrid"></div>
      </section>
      <section class="grid" id="jobs"></section>
      <section id="empty" class="empty" style="display: none;">
        Nenhum relatorio encontrado. Clique em "Gerar relatorio" para criar um novo.
      </section>
    </main>

    <script>
      (function () {
        const api = {
          last: "/relatorios/relatorio-subida-vendas/ultimo",
          start: "/relatorios/relatorio-subida-vendas",
          startGiga: "/relatorios/relatorio-subida-vendas/giga",
          status: function (queue, id) {
            return "/relatorios/job/" + queue + "/" + id;
          },
        };

        const state = { last: null, statuses: [], autoRefresh: true, timerId: null };

        function byId(id) {
          return document.getElementById(id);
        }

        function pad(value) {
          return value.toString().padStart(2, "0");
        }

        function formatNow() {
          const now = new Date();
          return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
        }

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function statusClass(status) {
          if (status === "completed") return "ok";
          if (status === "failed") return "bad";
          if (status === "active") return "run";
          if (status === "delayed" || status === "waiting" || status === "paused") return "wait";
          return "wait";
        }

        function buildSummary(result) {
          if (!result) return "Sem resultado ainda";
          if (Array.isArray(result.registros)) {
            return "Registros: " + result.registros.length;
          }
          return "Resultado disponivel";
        }

        function normalizeProgress(status) {
          if (!status) return 0;
          const progress = Number(status.progress);
          if (Number.isFinite(progress)) {
            return Math.max(0, Math.min(100, progress));
          }
          if (status.status === "completed") return 100;
          return 0;
        }

        function buildProgressBar(status) {
          const percent = normalizeProgress(status);
          return (
            "<div class=\\"progress-block\\">" +
            "<div class=\\"progress-head\\"><span>Progresso</span><strong>" +
            escapeHtml(formatValue(percent)) +
            "%</strong></div>" +
            "<div class=\\"progress-track\\"><div class=\\"progress-fill\\" style=\\"width:" +
            percent +
            "%\\"></div></div></div>"
          );
        }

        function isTerminalStatus(status) {
          return status === "completed" || status === "failed";
        }

        function allJobsFinished() {
          return (
            state.statuses.length > 0 &&
            state.statuses.every(function (item) {
              return item && isTerminalStatus(item.status);
            })
          );
        }

        function updateAutoRefreshMode() {
          const refreshMode = byId("refreshMode");
          refreshMode.textContent =
            "Atualizacao automatica: " + (state.autoRefresh ? "ativa" : "pausada");
        }

        function stopAutoRefresh() {
          state.autoRefresh = false;
          if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
          }
          updateAutoRefreshMode();
        }

        function startAutoRefresh() {
          if (state.timerId) {
            clearInterval(state.timerId);
          }
          state.autoRefresh = true;
          state.timerId = setInterval(function () {
            if (state.autoRefresh) {
              refreshAll();
            }
          }, 5000);
          updateAutoRefreshMode();
        }

        function formatValue(value) {
          if (typeof value === "number") {
            return new Intl.NumberFormat("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(value);
          }
          if (value === null || value === undefined || value === "") {
            return "--";
          }
          return String(value);
        }

        function sumNumericField(registros, fieldName) {
          return registros.reduce(function (total, item) {
            const value = Number(item && item[fieldName]);
            return Number.isFinite(value) ? total + value : total;
          }, 0);
        }

        function hasNumericField(registros, fieldName) {
          return (
            Array.isArray(registros) &&
            registros.some(function (item) {
              return Number.isFinite(Number(item && item[fieldName]));
            })
          );
        }

        function detectNumericField(registros) {
          if (!Array.isArray(registros) || registros.length === 0) return null;
          const preferredFields = [
            "TOTALTICKET",
            "TOTALITENS",
            "TOTALFISCAL",
            "VALOR",
            "TOTAL",
            "VLRTOTAL",
            "VALOR_TOTAL"
          ];
          for (const field of preferredFields) {
            if (registros.some(function (item) { return Number.isFinite(Number(item && item[field])); })) {
              return field;
            }
          }
          const first = registros[0];
          if (!first || typeof first !== "object") return null;
          return Object.keys(first).find(function (key) {
            return registros.some(function (item) {
              return Number.isFinite(Number(item && item[key]));
            });
          }) || null;
        }

        function buildResultMeta(status) {
          if (!status || !status.result) {
            return "<div class=\\"result-chip\\">Sem resultado disponivel ainda</div>";
          }

          const result = status.result;
          const registros = Array.isArray(result.registros) ? result.registros : [];
          const numericField = detectNumericField(registros);
          const total = numericField ? sumNumericField(registros, numericField) : null;
          const segmentos = Array.isArray(result.segmentos) ? result.segmentos.length : null;
          const lojas = Array.isArray(result.lojas) ? result.lojas.length : null;
          const faixaHoras =
            result.faixaHoras && result.faixaHoras.inicio && result.faixaHoras.fim
              ? result.faixaHoras.inicio + " ate " + result.faixaHoras.fim
              : null;
          const totalDia =
            result && Number.isFinite(Number(result.totalDia)) ? Number(result.totalDia) : null;

          const chips = [];
          chips.push(
            "<div class=\\"result-chip\\"><div class=\\"result-title\\">Registros</div><strong>" +
              formatValue(registros.length) +
              "</strong></div>"
          );

          if (hasNumericField(registros, "TOTALTICKET")) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Total Ticket</div><strong>" +
                formatValue(sumNumericField(registros, "TOTALTICKET")) +
                "</strong></div>"
            );
          }

          if (hasNumericField(registros, "TOTALITENS")) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Total Itens</div><strong>" +
                formatValue(sumNumericField(registros, "TOTALITENS")) +
                "</strong></div>"
            );
          }

          if (hasNumericField(registros, "TOTALFISCAL")) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Total Fiscal</div><strong>" +
                formatValue(sumNumericField(registros, "TOTALFISCAL")) +
                "</strong></div>"
            );
          }

          if (
            total !== null &&
            numericField !== "TOTALTICKET" &&
            numericField !== "TOTALITENS" &&
            numericField !== "TOTALFISCAL"
          ) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Total " +
                escapeHtml(numericField) +
                "</div><strong>" +
                formatValue(total) +
                "</strong></div>"
            );
          }

          if (segmentos !== null) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Segmentos</div><strong>" +
                formatValue(segmentos) +
                "</strong></div>"
            );
          }

          if (lojas !== null) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Lojas</div><strong>" +
                formatValue(lojas) +
                "</strong></div>"
            );
          }

          if (totalDia !== null) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Total do Dia</div><strong>" +
                formatValue(totalDia) +
                "</strong></div>"
            );
          }

          if (status.duracaoFormatada) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Duracao</div><strong>" +
                escapeHtml(status.duracaoFormatada) +
                "</strong></div>"
            );
          }

          if (faixaHoras) {
            chips.push(
              "<div class=\\"result-chip\\"><div class=\\"result-title\\">Faixa</div><strong>" +
                escapeHtml(faixaHoras) +
                "</strong></div>"
            );
          }

          return chips.join("");
        }

        function buildPreviewTable(status) {
          if (!status || !status.result || !Array.isArray(status.result.registros)) {
            return "";
          }

          const registros = status.result.registros;
          if (registros.length === 0) {
            return "<div class=\\"mono\\">Nenhum registro retornado.</div>";
          }

          const columns = Object.keys(registros[0]).slice(0, 4);
          const rows =
            status.result && status.result.granularidade === "HORA"
              ? registros
              : registros.slice(0, 5);

          return (
            "<div class=\\"preview-wrap\\"><table class=\\"preview-table\\"><thead><tr>" +
            columns
              .map(function (column) {
                return "<th>" + escapeHtml(column) + "</th>";
              })
              .join("") +
            "</tr></thead><tbody>" +
            rows
              .map(function (row) {
                return (
                  "<tr>" +
                  columns
                    .map(function (column) {
                      return "<td>" + escapeHtml(formatValue(row[column])) + "</td>";
                    })
                    .join("") +
                  "</tr>"
                );
              })
              .join("") +
            "</tbody></table></div>"
          );
        }

        function renderOverview() {
          const overview = byId("overview");
          if (!state.last) {
            overview.innerHTML = "";
            return;
          }

          const completed = state.statuses.filter(function (item) {
            return item && item.status === "completed";
          }).length;
          const failed = state.statuses.filter(function (item) {
            return item && item.status === "failed";
          }).length;
          const active = state.statuses.filter(function (item) {
            return item && !isTerminalStatus(item.status);
          }).length;
          const totalRegistros = state.statuses.reduce(function (acc, item) {
            const registros =
              item && item.result && Array.isArray(item.result.registros)
                ? item.result.registros.length
                : 0;
            return acc + registros;
          }, 0);

          overview.innerHTML =
            "<article class=\\"metric\\"><div>Concluidos</div><strong>" +
            completed +
            "</strong></article>" +
            "<article class=\\"metric\\"><div>Em andamento</div><strong>" +
            active +
            "</strong></article>" +
            "<article class=\\"metric\\"><div>Falharam</div><strong>" +
            failed +
            "</strong></article>" +
            "<article class=\\"metric\\"><div>Registros retornados</div><strong>" +
            totalRegistros +
            "</strong></article>";
        }

        function renderLogsPanel() {
          const logsPanel = byId("logsPanel");
          const logsGrid = byId("logsGrid");

          if (!state.last || state.statuses.length === 0) {
            logsGrid.innerHTML = "";
            return;
          }

          logsGrid.innerHTML = state.last.jobs
            .map(function (job, index) {
              const status = state.statuses[index] || {};
              const failedReason = status.failedReason
                ? "<div class=\\"error-box\\">" + escapeHtml(status.failedReason) + "</div>"
                : "";
              const logs = Array.isArray(status.logs) && status.logs.length > 0
                ? "<ul class=\\"log-list\\">" +
                  status.logs
                    .map(function (line) {
                      return "<li>" + escapeHtml(line) + "</li>";
                    })
                    .join("") +
                  "</ul>"
                : "<div class=\\"mono\\">Sem logs disponiveis.</div>";

              return (
                "<article class=\\"log-card\\">" +
                "<h4>" + escapeHtml(job.nome) + "</h4>" +
                "<div class=\\"mono\\">Status: " + escapeHtml(status.status || "aguardando") + "</div>" +
                failedReason +
                logs +
                "</article>"
              );
            })
            .join("");
        }

        function toggleLogsPanel() {
          const logsPanel = byId("logsPanel");
          if (logsPanel.hasAttribute("hidden")) {
            logsPanel.removeAttribute("hidden");
          } else {
            logsPanel.setAttribute("hidden", "");
          }
        }

        async function fetchJson(url, options) {
          const res = await fetch(url, options);
          if (!res.ok) return null;
          return res.json();
        }

        async function loadLast() {
          const data = await fetchJson(api.last);
          if (!data || !data.encontrado) {
            state.last = null;
            return null;
          }
          state.last = data;
          return data;
        }

        async function loadStatuses(jobs) {
          const responses = await Promise.all(
            jobs.map(function (job) {
              return fetchJson(api.status(job.queue, job.jobId));
            })
          );
          state.statuses = responses;
          return responses;
        }

        function render() {
          const metaRun = byId("meta-run");
          const metaPeriod = byId("meta-period");
          const lastUpdate = byId("lastUpdate");
          const jobCount = byId("jobCount");
          const jobsEl = byId("jobs");
          const emptyEl = byId("empty");
          const logsPanel = byId("logsPanel");

          jobsEl.innerHTML = "";

          if (!state.last) {
            metaRun.textContent = "Nenhum relatorio registrado";
            metaPeriod.textContent = "Periodo: --";
            jobCount.textContent = "Jobs: 0";
            emptyEl.style.display = "block";
            logsPanel.setAttribute("hidden", "");
            renderOverview();
            return;
          }

          emptyEl.style.display = "none";
          metaRun.textContent = "Ultimo disparo: " + state.last.criadoEm;
          metaPeriod.textContent =
            "Periodo: " + state.last.dataIni + " ate " + state.last.dataFim;
          jobCount.textContent = "Jobs: " + state.last.jobs.length;
          lastUpdate.textContent = "Ultima atualizacao: " + new Date().toLocaleTimeString();
          renderOverview();
          renderLogsPanel();

          state.last.jobs.forEach(function (job, index) {
            const status = state.statuses[index] || {};
            const badgeClass = statusClass(status.status);
            const summary = buildSummary(status.result);
            const resultMeta = buildResultMeta(status);
            const progressBar = buildProgressBar(status);
            const previewTable = buildPreviewTable(status);
            const failedReason = status.failedReason
              ? "<div class=\\"error-box\\">" + escapeHtml(status.failedReason) + "</div>"
              : "";

            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML =
              "<div class=\\"badge " +
              badgeClass +
              "\\">" +
              (status.status || "aguardando") +
              "</div>" +
              "<h3>" +
              job.nome +
              "</h3>" +
              "<div class=\\"mono\\">Queue: " +
              job.queue +
              "</div>" +
              "<div class=\\"mono\\">Job: " +
              job.jobId +
              "</div>" +
              progressBar +
              "<div>" +
              summary +
              "</div>" +
              "<div class=\\"result-meta\\">" +
              resultMeta +
              "</div>" +
              failedReason +
              previewTable +
              "<details><summary>Ver JSON</summary><pre>" +
              escapeHtml(JSON.stringify(status, null, 2)) +
              "</pre></details>";

            jobsEl.appendChild(card);
          });
        }

        async function refreshAll() {
          const last = await loadLast();
          if (!last) {
            render();
            return;
          }
          await loadStatuses(last.jobs);
          if (allJobsFinished()) {
            stopAutoRefresh();
          }
          render();
        }

        async function triggerReport(url) {
          const dataIni = byId("dataIni").value;
          const dataFim = byId("dataFim").value;

          const payload = {};
          if (dataIni) payload.dataIni = dataIni;
          if (dataFim) payload.dataFim = dataFim;

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            startAutoRefresh();
            await refreshAll();
          } else {
            alert("Falha ao gerar relatorio.");
          }
        }

        byId("dataIni").value = formatNow();
        byId("dataFim").value = formatNow();
        byId("btnGerar").addEventListener("click", function () {
          return triggerReport(api.start);
        });
        byId("btnGerarGiga").addEventListener("click", function () {
          return triggerReport(api.startGiga);
        });
        byId("btnAtualizar").addEventListener("click", refreshAll);
        byId("btnLogs").addEventListener("click", toggleLogsPanel);

        updateAutoRefreshMode();
        refreshAll();
        startAutoRefresh();
      })();
    </script>
  </body>
</html>
`;

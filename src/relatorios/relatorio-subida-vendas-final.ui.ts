export const relatorioSubidaVendasFinalHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatorio Final Consolidado</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --radius: 24px;
        --radius-sm: 14px;
        --shadow: 0 24px 80px rgba(16, 24, 40, 0.16);
      }

      body[data-theme="principal"] {
        --bg: #f4eee4;
        --bg-accent: #dbeee9;
        --surface: rgba(255, 255, 255, 0.82);
        --surface-strong: #ffffff;
        --ink: #172026;
        --muted: #5c6a73;
        --line: rgba(23, 32, 38, 0.08);
        --primary: #d96d3b;
        --primary-soft: rgba(217, 109, 59, 0.14);
        --secondary: #28796f;
        --badge: rgba(23, 32, 38, 0.06);
        --table-head: rgba(23, 32, 38, 0.04);
      }

      body[data-theme="escuro"] {
        --bg: #0e1520;
        --bg-accent: #162132;
        --surface: rgba(17, 24, 39, 0.9);
        --surface-strong: #111827;
        --ink: #ecf3ff;
        --muted: #9eb0c7;
        --line: rgba(236, 243, 255, 0.1);
        --primary: #6fb1ff;
        --primary-soft: rgba(111, 177, 255, 0.14);
        --secondary: #4fd1b4;
        --badge: rgba(255, 255, 255, 0.06);
        --table-head: rgba(255, 255, 255, 0.05);
      }

      body[data-theme="azul"] {
        --bg: #eaf2ff;
        --bg-accent: #d9e9ff;
        --surface: rgba(255, 255, 255, 0.86);
        --surface-strong: #ffffff;
        --ink: #12233d;
        --muted: #5d708f;
        --line: rgba(18, 35, 61, 0.08);
        --primary: #2b6fe8;
        --primary-soft: rgba(43, 111, 232, 0.12);
        --secondary: #0f8acb;
        --badge: rgba(18, 35, 61, 0.06);
        --table-head: rgba(43, 111, 232, 0.06);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, var(--bg-accent), transparent 36%),
          linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--bg) 75%, white));
        min-height: 100vh;
      }

      .shell {
        max-width: 1400px;
        margin: 0 auto;
        padding: 40px 24px 72px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.5fr minmax(220px, 320px);
        gap: 20px;
        align-items: stretch;
        margin-bottom: 28px;
      }

      .hero-card,
      .theme-card,
      .summary-card,
      .section-card,
      .message-card {
        background: var(--surface);
        backdrop-filter: blur(18px);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
      }

      .hero-card {
        border-radius: calc(var(--radius) + 6px);
        padding: 28px;
        position: relative;
        overflow: hidden;
      }

      .hero-card::after {
        content: "";
        position: absolute;
        inset: auto -10% -35% auto;
        width: 260px;
        height: 260px;
        background: radial-gradient(circle, var(--primary-soft), transparent 68%);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: 999px;
        background: var(--badge);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .hero-title {
        margin-top: 18px;
        font-size: clamp(32px, 4vw, 54px);
        line-height: 1.04;
        letter-spacing: -0.04em;
        max-width: 720px;
      }

      .hero-subtitle {
        margin-top: 14px;
        color: var(--muted);
        max-width: 720px;
        line-height: 1.6;
      }

      .hero-meta {
        margin-top: 22px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .hero-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        background: var(--surface-strong);
        border: 1px solid var(--line);
        font-size: 13px;
      }

      .theme-card {
        border-radius: calc(var(--radius) + 6px);
        padding: 24px;
        display: grid;
        gap: 16px;
        align-content: start;
      }

      .theme-card label,
      .theme-card strong {
        font-size: 14px;
      }

      .theme-card select {
        width: 100%;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: var(--surface-strong);
        color: var(--ink);
        padding: 12px 14px;
        font-family: inherit;
        font-size: 14px;
      }

      .theme-swatches {
        display: flex;
        gap: 10px;
      }

      .theme-swatches span {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        border: 1px solid var(--line);
      }

      .theme-swatches span[data-swatch="principal"] {
        background: linear-gradient(135deg, #d96d3b, #28796f);
      }

      .theme-swatches span[data-swatch="escuro"] {
        background: linear-gradient(135deg, #0f172a, #1d4ed8);
      }

      .theme-swatches span[data-swatch="azul"] {
        background: linear-gradient(135deg, #eaf2ff, #2b6fe8);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 22px;
      }

      .summary-card {
        border-radius: var(--radius);
        padding: 20px;
      }

      .summary-card small {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 11px;
        font-weight: 700;
      }

      .summary-card strong {
        display: block;
        margin-top: 10px;
        font-size: clamp(24px, 3vw, 38px);
        letter-spacing: -0.04em;
      }

      .summary-card p {
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
      }

      .section-stack {
        display: grid;
        gap: 18px;
      }

      .section-card {
        border-radius: var(--radius);
        padding: 22px;
      }

      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .section-title {
        display: grid;
        gap: 6px;
      }

      .section-title p {
        color: var(--muted);
        font-size: 13px;
      }

      .section-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .chip {
        border-radius: 999px;
        padding: 8px 12px;
        background: var(--badge);
        border: 1px solid var(--line);
        font-size: 12px;
      }

      .status {
        font-weight: 700;
      }

      .status.completed {
        color: #1f8a63;
      }

      .status.failed {
        color: #c2410c;
      }

      .status.waiting,
      .status.active {
        color: var(--primary);
      }

      .table-wrap {
        overflow-x: auto;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--surface-strong);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      th,
      td {
        padding: 12px 14px;
        text-align: left;
        font-size: 13px;
        border-bottom: 1px solid var(--line);
        white-space: nowrap;
      }

      th {
        background: var(--table-head);
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 11px;
        text-align: left;
      }

      td.numeric {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .manual-input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        padding: 10px 12px;
        font-family: inherit;
        text-align: right;
      }

      .table-wrap th.numeric-head,
      .table-wrap td.numeric {
        text-align: right;
      }

      .table-wrap th.input-head,
      .table-wrap td.input-cell {
        text-align: right;
      }

      .table-wrap tr.total-row td {
        border-top: 2px solid var(--line);
        font-weight: 700;
        background: color-mix(in srgb, var(--surface-strong) 72%, transparent);
      }

      .paste-tools {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
        align-items: center;
      }

      .ghost-button {
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        border-radius: 12px;
        padding: 10px 14px;
        font-family: inherit;
        cursor: pointer;
      }

      .paste-feedback {
        font-size: 13px;
        color: var(--muted);
      }

      .paste-feedback.error {
        color: #b3261e;
      }

      .paste-feedback.success {
        color: #1b7f47;
      }

      .giga-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 16px;
      }

      .giga-summary-card {
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--surface-strong);
        padding: 16px;
      }

      .giga-summary-card small {
        display: block;
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .giga-summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      .difference-positive {
        color: #c2410c;
        font-weight: 700;
      }

      .difference-negative {
        color: #047857;
        font-weight: 700;
      }

      .difference-neutral {
        color: var(--muted);
        font-weight: 700;
      }

      .message-card {
        margin-top: 18px;
        border-radius: var(--radius);
        padding: 26px;
        text-align: center;
      }

      .message-card p {
        color: var(--muted);
        margin-top: 10px;
        line-height: 1.6;
      }

      .giga-spotlight {
        margin-bottom: 22px;
      }

      .footer-note {
        margin-top: 22px;
        text-align: center;
        font-size: 12px;
        color: var(--muted);
      }

      @media (max-width: 1120px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .shell {
          padding: 24px 16px 56px;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }

        .section-head {
          flex-direction: column;
        }

        .section-meta {
          justify-content: flex-start;
        }
      }
    </style>
  </head>
  <body data-theme="principal">
    <main class="shell">
      <section class="hero">
        <article class="hero-card">
          <span class="eyebrow">Relatorio Final</span>
          <h1 class="hero-title">Subida de vendas consolidada. Template sugerido.</h1>
          <p class="hero-subtitle">
            Template inicial em HTML para acompanhar o fechamento do relatorio consolidado.
          </p>
          <div class="hero-meta">
            <span class="hero-pill" id="metaPeriodo">Periodo: --</span>
            <span class="hero-pill" id="metaGeradoEm">Gerado em: --</span>
            <span class="hero-pill" id="metaPronto">Status: aguardando</span>
          </div>
        </article>

        <aside class="theme-card">
          <strong>Tema do relatorio</strong>
          <label for="themeSelect">Escolha a paleta ativa</label>
          <select id="themeSelect">
            <option value="principal">Principal</option>
            <option value="escuro">Escuro</option>
            <option value="azul">Azul</option>
          </select>
          <div class="theme-swatches" aria-hidden="true">
            <span data-swatch="principal"></span>
            <span data-swatch="escuro"></span>
            <span data-swatch="azul"></span>
          </div>
        </aside>
      </section>

        <section class="summary-grid" id="summaryGrid"></section>
      <section class="section-stack" id="comparativos"></section>
      <section class="giga-spotlight" id="gigaSpotlight"></section>
      <section class="message-card" id="emptyState" hidden>
        <h2>Relatorio final ainda nao esta disponivel</h2>
        <p id="emptyMessage">Assim que o ultimo relatorio concluir, esta tela passa a mostrar o consolidado.</p>
      </section>
      <p class="footer-note">Template sugerido para o front.</p>
    </main>

      <script>
      (function () {
        const THEME_KEY = "relatorio-final-theme";
        const SAP_STORAGE_PREFIX = "relatorio-final-sap";
        const api = {
          data: "/relatorios/relatorio-subida-vendas/final/data",
        };

        function byId(id) {
          return document.getElementById(id);
        }

        function setTheme(theme) {
          document.body.setAttribute("data-theme", theme);
          localStorage.setItem(THEME_KEY, theme);
          byId("themeSelect").value = theme;
        }

        function restoreTheme() {
          const saved = localStorage.getItem(THEME_KEY) || "principal";
          setTheme(saved);
        }

        function formatNumber(value) {
          if (!Number.isFinite(Number(value))) return "--";
          return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(Number(value));
        }

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function isNumericCell(value) {
          return typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)));
        }

        function getDifferenceClass(value) {
          const number = Number(value);
          if (!Number.isFinite(number) || number === 0) return "difference-neutral";
          return number > 0 ? "difference-positive" : "difference-negative";
        }

        function formatPercent(value) {
          if (!Number.isFinite(Number(value))) return "--";
          return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(value)) + "%";
        }

        function parseBrCurrency(value) {
          const raw = String(value || "")
            .replace(/BRL/gi, "")
            .replace(/R\\$/gi, "")
            .replace(/\s+/g, "")
            .replace(/[^0-9,.-]/g, "")
            .trim();

          if (!raw) return null;

          const lastComma = raw.lastIndexOf(",");
          const lastDot = raw.lastIndexOf(".");
          const separatorIndex = Math.max(lastComma, lastDot);

          if (separatorIndex === -1) {
            const parsedInteger = Number(raw.replace(/[^0-9-]/g, ""));
            return Number.isFinite(parsedInteger) ? parsedInteger : null;
          }

          const integerPart = raw
            .slice(0, separatorIndex)
            .replace(/[^0-9-]/g, "");
          const decimalPart = raw
            .slice(separatorIndex + 1)
            .replace(/[^0-9]/g, "");

          const normalized = decimalPart ? integerPart + "." + decimalPart : integerPart;
          const parsed = Number(normalized);
          return Number.isFinite(parsed) ? parsed : null;
        }

        function buildSummaryCard(title, value, subtitle) {
          return (
            "<article class=\\"summary-card\\">" +
            "<small>" + escapeHtml(title) + "</small>" +
            "<strong>" + escapeHtml(value) + "</strong>" +
            "<p>" + escapeHtml(subtitle) + "</p>" +
            "</article>"
          );
        }

        function buildSection(section, options) {
          const rows = Array.isArray(section.rows) ? section.rows : [];
          const columns = Array.isArray(section.columns) ? section.columns : [];
          const limit = options && Number.isFinite(options.limit) ? options.limit : rows.length;
          const visibleRows = rows.slice(0, limit);
          const statusClass = String(section.status || "waiting").toLowerCase();

          const meta = [
            section.total !== null && section.total !== undefined ? "Total: " + formatNumber(section.total) : null,
            section.criterioConsulta ? "Consulta: " + section.criterioConsulta : null,
            section.faixaHoras ? "Faixa: " + section.faixaHoras.inicio + " ate " + section.faixaHoras.fim : null,
          ].filter(Boolean);

          const head =
            "<div class=\\"section-head\\">" +
              "<div class=\\"section-title\\">" +
                "<h2>" + escapeHtml(section.nome || "Sem nome") + "</h2>" +
                "<p>" + escapeHtml(section.database || "Base nao informada") + "</p>" +
              "</div>" +
              "<div class=\\"section-meta\\">" +
                "<span class=\\"chip status " + escapeHtml(statusClass) + "\\">" + escapeHtml(section.status || "waiting") + "</span>" +
                meta.map(function (item) { return "<span class=\\"chip\\">" + escapeHtml(item) + "</span>"; }).join("") +
              "</div>" +
            "</div>";

          if (section.failedReason) {
            return (
              "<article class=\\"section-card\\">" + head +
              "<p>" + escapeHtml(section.failedReason) + "</p>" +
              "</article>"
            );
          }

          if (rows.length === 0 || columns.length === 0) {
            return (
              "<article class=\\"section-card\\">" + head +
              "<p>Nenhum registro disponivel para esta base.</p>" +
              "</article>"
            );
          }

          const table =
            "<div class=\\"table-wrap\\"><table><thead><tr>" +
            columns.map(function (col) {
              return "<th>" + escapeHtml(col) + "</th>";
            }).join("") +
            "</tr></thead><tbody>" +
            visibleRows.map(function (row) {
              return "<tr>" + columns.map(function (col) {
                const value = row[col];
                const numeric = isNumericCell(value) ? " numeric" : "";
                const rendered = typeof value === "number" ? formatNumber(value) : String(value ?? "--");
                return "<td class=\\"" + numeric.trim() + "\\">" + escapeHtml(rendered) + "</td>";
              }).join("") + "</tr>";
            }).join("") +
            "</tbody></table></div>";

          return "<article class=\\"section-card\\">" + head + table + "</article>";
        }

        function getSapStorageKey(data) {
          return SAP_STORAGE_PREFIX + ":" + String(data.dataIni || "--") + ":" + String(data.dataFim || "--");
        }

        function readSapValues(storageKey) {
          try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : {};
          } catch (error) {
            return {};
          }
        }

        function writeSapValues(storageKey, values) {
          localStorage.setItem(storageKey, JSON.stringify(values));
        }

        function extractSapValues(rawText) {
          return String(rawText || "")
            .split(/\\r?\\n/)
            .map(function (line) { return parseBrCurrency(line); })
            .filter(function (value) { return value !== null; });
        }

        function applySapValuesToInputs(values) {
          const inputs = Array.from(document.querySelectorAll("[data-manual-sap]"));
          inputs.slice(0, 5).forEach(function (input, index) {
            const value = values[index];
            input.value = value === null || value === undefined ? "" : formatNumber(value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("blur", { bubbles: true }));
          });
        }

        function setPasteFeedback(id, message, type) {
          const feedback = document.querySelector("[data-paste-feedback='" + id + "']");
          if (!feedback) return;
          feedback.textContent = message || "";
          feedback.className = "paste-feedback" + (type ? " " + type : "");
        }

        function summarizeManualSap(inputs) {
          return inputs.reduce(function (acc, input) {
            const row = input.closest("tr");
            if (!row) return acc;

            const emporiumValue = parseBrCurrency(row.children[1] ? row.children[1].textContent : "");
            const sapValue = parseBrCurrency(input.value);

            acc.totalEmporium += Number.isFinite(emporiumValue) ? emporiumValue : 0;
            acc.totalSap += Number.isFinite(sapValue) ? sapValue : 0;
            return acc;
          }, { totalEmporium: 0, totalSap: 0 });
        }

        function updateManualSapSummary(section) {
          const inputs = Array.from(section.querySelectorAll("[data-manual-sap]"));
          if (!inputs.length) return;

          const totals = summarizeManualSap(inputs);
          const diferenca = totals.totalEmporium - totals.totalSap;
          const diferencaPercentual =
            totals.totalEmporium !== 0 ? (diferenca / totals.totalEmporium) * 100 : null;
          const metaNodes = section.querySelectorAll("[data-manual-total]");
          const totalRow = section.querySelector("[data-manual-total-row]");

          metaNodes.forEach(function (node) {
            const field = node.getAttribute("data-manual-total");
            if (field === "emporium") node.textContent = formatNumber(totals.totalEmporium);
            if (field === "sap") node.textContent = formatNumber(totals.totalSap);
            if (field === "diferenca") node.textContent = formatNumber(diferenca);
            if (field === "percentual") node.textContent = formatPercent(diferencaPercentual);
          });

          if (totalRow) {
            const cells = totalRow.querySelectorAll("td");
            if (cells[1]) cells[1].textContent = formatNumber(totals.totalEmporium);
            if (cells[2]) cells[2].textContent = formatNumber(totals.totalSap);
            if (cells[3]) {
              cells[3].textContent = formatNumber(diferenca);
              cells[3].className = "numeric " + getDifferenceClass(diferenca);
            }
            if (cells[4]) {
              cells[4].textContent = formatPercent(diferencaPercentual);
              cells[4].className = "numeric " + getDifferenceClass(diferencaPercentual);
            }
          }
        }

        function buildComparativoSection(comparativo, storageKey) {
          const rows = Array.isArray(comparativo.rows) ? comparativo.rows : [];
          const isManual = comparativo.tipo === "manual";
          const rightLabel = comparativo.rightLabel || "BASE_2";
          const leftLabel = comparativo.leftLabel || "BASE_1";

          const totals = isManual
            ? {
                totalLeft: comparativo.totalLeft ?? 0,
                totalRight: comparativo.totalRight ?? null,
                diferencaTotal: comparativo.diferencaTotal ?? null,
                percentualDiferencaTotal: comparativo.percentualDiferencaTotal ?? null,
              }
            : {
                totalLeft: comparativo.totalLeft ?? 0,
                totalRight: comparativo.totalRight ?? 0,
                diferencaTotal: comparativo.diferencaTotal ?? 0,
                percentualDiferencaTotal: comparativo.percentualDiferencaTotal ?? null,
              };

          const meta = [
            "Total " + leftLabel + ": " + (isManual
              ? "<span data-manual-total=\\"emporium\\">" + escapeHtml(formatNumber(totals.totalLeft)) + "</span>"
              : escapeHtml(formatNumber(totals.totalLeft))),
            "Total " + rightLabel + ": " + (isManual
              ? "<span data-manual-total=\\"sap\\">" + escapeHtml(formatNumber(totals.totalRight)) + "</span>"
              : escapeHtml(formatNumber(totals.totalRight))),
            "Diferenca: " + (isManual
              ? "<span data-manual-total=\\"diferenca\\">" + escapeHtml(formatNumber(totals.diferencaTotal)) + "</span>"
              : escapeHtml(formatNumber(totals.diferencaTotal))),
            "Diferenca %: " + (isManual
              ? "<span data-manual-total=\\"percentual\\">" + escapeHtml(formatPercent(totals.percentualDiferencaTotal)) + "</span>"
              : escapeHtml(formatPercent(totals.percentualDiferencaTotal))),
          ].filter(Boolean);

          const head =
            "<div class=\\"section-head\\">" +
              "<div class=\\"section-title\\">" +
                "<h2>" + escapeHtml(comparativo.titulo || "Comparativo") + "</h2>" +
                "<p>" + escapeHtml(comparativo.subtitulo || "") + "</p>" +
              "</div>" +
              "<div class=\\"section-meta\\">" +
                meta.map(function (item) { return "<span class=\\"chip\\">" + item + "</span>"; }).join("") +
              "</div>" +
            "</div>";

          const headers = isManual
            ? ["BANDEIRA", leftLabel, rightLabel, "DIFERENCA", "DIFERENCA_%"]
            : ["REFERENCIA", leftLabel, rightLabel, "DIFERENCA", "DIFERENCA_%"];

          const body = rows.map(function (row) {
            if (isManual) {
              const sapValue = row.SAP;
              const diffValue = row.DIFERENCA;
              const diffPercent = row.DIFERENCA_PERCENTUAL;
              return (
                "<tr>" +
                  "<td>" + escapeHtml(row.BANDEIRA || "--") + "</td>" +
                  "<td class=\\"numeric\\">" + escapeHtml(formatNumber(row.EMPORIUM)) + "</td>" +
                  "<td class=\\"input-cell\\"><input class=\\"manual-input\\" data-manual-sap=\\"" + escapeHtml(row.rowKey) + "\\" data-storage-key=\\"" + escapeHtml(storageKey) + "\\" value=\\"" + escapeHtml(sapValue === null || sapValue === undefined ? "" : String(sapValue)) + "\\" placeholder=\\"Digite o SAP\\" /></td>" +
                  "<td class=\\"numeric " + getDifferenceClass(diffValue) + "\\">" + escapeHtml(diffValue === null || diffValue === undefined ? "--" : formatNumber(diffValue)) + "</td>" +
                  "<td class=\\"numeric " + getDifferenceClass(diffPercent) + "\\">" + escapeHtml(formatPercent(diffPercent)) + "</td>" +
                "</tr>"
              );
            }

            return (
              "<tr>" +
                "<td>" + escapeHtml(row.REFERENCIA || "--") + "</td>" +
                "<td class=\\"numeric\\">" + escapeHtml(formatNumber(row[leftLabel])) + "</td>" +
                "<td class=\\"numeric\\">" + escapeHtml(formatNumber(row[rightLabel])) + "</td>" +
                "<td class=\\"numeric " + getDifferenceClass(row.DIFERENCA) + "\\">" + escapeHtml(formatNumber(row.DIFERENCA)) + "</td>" +
                "<td class=\\"numeric " + getDifferenceClass(row.DIFERENCA_PERCENTUAL) + "\\">" + escapeHtml(formatPercent(row.DIFERENCA_PERCENTUAL)) + "</td>" +
              "</tr>"
            );
          }).join("") + (isManual
            ? (
                "<tr class=\\"total-row\\" data-manual-total-row>" +
                  "<td>Total</td>" +
                  "<td class=\\"numeric\\">" + escapeHtml(formatNumber(totals.totalLeft)) + "</td>" +
                  "<td class=\\"numeric\\">" + escapeHtml(formatNumber(totals.totalRight)) + "</td>" +
                  "<td class=\\"numeric\\">" + escapeHtml(formatNumber(totals.diferencaTotal)) + "</td>" +
                  "<td class=\\"numeric\\">" + escapeHtml(formatPercent(totals.percentualDiferencaTotal)) + "</td>" +
                "</tr>"
              )
            : "");

          const pasteTools = isManual
            ? "<div class=\\"paste-tools\\">" +
                "<button type=\\"button\\" class=\\"ghost-button\\" data-paste-toggle=\\"" + escapeHtml(comparativo.id) + "\\">Colar SAP</button>" +
                "<span class=\\"paste-feedback\\" data-paste-feedback=\\"" + escapeHtml(comparativo.id) + "\\">Clique para colar os 5 valores do SAP da area de transferencia.</span>" +
              "</div>"
            : "";

          return (
            "<article class=\\"section-card\\">" +
              head +
              pasteTools +
              "<div class=\\"table-wrap\\"><table><thead><tr>" +
                headers.map(function (header) {
                  const klass = header === "BANDEIRA" || header === "REFERENCIA"
                    ? ""
                    : header === rightLabel
                      ? "input-head"
                      : "numeric-head";
                  return "<th class=\\"" + klass + "\\">" + escapeHtml(header.replace("_", " ")) + "</th>";
                }).join("") +
              "</tr></thead><tbody>" + body + "</tbody></table></div>" +
            "</article>"
          );
        }

        function applyManualSapEnhancements(data) {
          const storageKey = getSapStorageKey(data);
            const savedValues = readSapValues(storageKey);

          document.querySelectorAll("[data-manual-sap]").forEach(function (input) {
            const key = input.getAttribute("data-manual-sap");
            if (savedValues[key] !== undefined && savedValues[key] !== null) {
              input.value = formatNumber(savedValues[key]);
            }

            const updateDifference = function () {
              const row = input.closest("tr");
              const emporiumCell = row.children[1];
              const diffCell = row.children[3];
              const diffPercentCell = row.children[4];
              const emporiumValue = Number(String(emporiumCell.textContent).replace(/\\./g, "").replace(",", "."));
              const typedValue = parseBrCurrency(input.value);
              const hasTypedValue = input.value.trim() !== "" && Number.isFinite(typedValue);
              const diff = hasTypedValue ? emporiumValue - typedValue : null;
              const diffPercent = hasTypedValue && emporiumValue !== 0 ? (diff / emporiumValue) * 100 : null;

              diffCell.textContent = diff === null ? "--" : formatNumber(diff);
              diffCell.className = "numeric " + getDifferenceClass(diff);
              diffPercentCell.textContent = formatPercent(diffPercent);
              diffPercentCell.className = "numeric " + getDifferenceClass(diffPercent);

              if (hasTypedValue) {
                savedValues[key] = typedValue;
              } else if (input.value.trim() === "") {
                delete savedValues[key];
              }

              writeSapValues(storageKey, savedValues);
              updateManualSapSummary(input.closest(".section-card"));
            };

            input.addEventListener("input", updateDifference);
            input.addEventListener("blur", function () {
              const typedValue = parseBrCurrency(input.value);
              if (input.value.trim() === "") {
                input.value = "";
                return;
              }

              if (typedValue !== null) {
                input.value = formatNumber(typedValue);
              }
            });
            updateDifference();
          });

          document.querySelectorAll("[data-manual-total-row]").forEach(function (row) {
            updateManualSapSummary(row.closest(".section-card"));
          });

          document.querySelectorAll("[data-paste-toggle]").forEach(function (button) {
            button.addEventListener("click", async function () {
              const id = button.getAttribute("data-paste-toggle");

              try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                  const clipboardText = await navigator.clipboard.readText();
                  const values = extractSapValues(clipboardText);

                  if (values.length >= 5) {
                    applySapValuesToInputs(values);
                    setPasteFeedback(id, "Valores do SAP aplicados com sucesso.", "success");
                    return;
                  }

                  setPasteFeedback(
                    id,
                    "A area de transferencia nao trouxe 5 valores validos no formato esperado do SAP.",
                    "error",
                  );
                  return;
                }

                setPasteFeedback(
                  id,
                  "Nao foi possivel ler a area de transferencia neste navegador.",
                  "error",
                );
                return;
              } catch (error) {
                setPasteFeedback(
                  id,
                  "Nao foi possivel ler a area de transferencia do navegador.",
                  "error",
                );
              }
            });
          });
        }

        function buildGigaSpotlight(giga) {
          const resumo = giga && giga.resumoFaixas ? giga.resumoFaixas : {};
          const cards = [
            { title: "Faixa considerada", value: resumo && resumo.faixaConsiderada ? resumo.faixaConsiderada.inicio + " ate " + resumo.faixaConsiderada.fim : giga && giga.faixaHoras ? giga.faixaHoras.inicio + " ate " + giga.faixaHoras.fim : "--", subtitle: "Somente horarios fechados" },
            { title: "Total ate penultima", value: formatNumber(resumo.totalAtePenultimaFaixa), subtitle: "Acumulado anterior" },
            { title: "Ultima faixa", value: formatNumber(resumo.totalUltimaFaixa), subtitle: "Valor da ultima faixa fechada" },
            { title: "Total atual", value: formatNumber(resumo.totalAtualAposUltimaFaixa), subtitle: "Aumento: " + formatNumber(resumo.aumentoValor) + " | Percentual: " + formatPercent(resumo.aumentoPercentual) },
          ];

          const cardsHtml =
            "<div class=\\"giga-summary-grid\\">" +
            cards.map(function (card) {
              return "<article class=\\"giga-summary-card\\"><small>" + escapeHtml(card.title) + "</small><strong>" + escapeHtml(card.value) + "</strong><p>" + escapeHtml(card.subtitle) + "</p></article>";
            }).join("") +
            "</div>";

          const sectionHtml = buildSection(giga, { limit: giga.rows.length });
          return sectionHtml.replace(
            "<div class=\\"table-wrap\\">",
            cardsHtml + "<div class=\\"table-wrap\\">",
          );
        }

        function renderEmpty(message) {
          byId("summaryGrid").innerHTML = "";
          byId("comparativos").innerHTML = "";
          byId("gigaSpotlight").innerHTML = "";
          byId("emptyState").hidden = false;
          byId("emptyMessage").textContent = message;
        }

        function render(data) {
          byId("metaPeriodo").textContent = "Periodo: " + (data.dataIni || "--") + " ate " + (data.dataFim || "--");
          byId("metaGeradoEm").textContent = "Gerado em: " + (data.criadoEm || "--");
          byId("metaPronto").textContent = "Status: " + (data.pronto ? "pronto" : "aguardando conclusao");

          if (!data.encontrado) {
            return renderEmpty("Nenhum relatorio de subida foi registrado ainda.");
          }

          if (!data.pronto) {
            return renderEmpty("O ultimo relatorio ainda nao concluiu com sucesso em todos os jobs.");
          }

          byId("emptyState").hidden = true;

          const resumo = data.resumo || {};
          byId("summaryGrid").innerHTML = [
            buildSummaryCard("Jobs concluidos", formatNumber(resumo.jobsConcluidos || 0), "Total de bases finalizadas com sucesso"),
            buildSummaryCard("Comparativos", formatNumber(resumo.totalComparativos || 0), "Blocos comparativos prontos para conciliacao"),
            buildSummaryCard("Bases com dados", formatNumber(resumo.basesComDados || 0), "Bases retornando registros no consolidado"),
            buildSummaryCard("GIGA liquida", formatNumber(resumo.totalGigaLiquida || 0), "Total de GIGA ate a ultima hora fechada"),
          ].join("");

          const storageKey = getSapStorageKey(data);
          byId("comparativos").innerHTML = (Array.isArray(data.comparativos) ? data.comparativos : [])
            .map(function (comparativo) {
              return buildComparativoSection(comparativo, storageKey);
            })
            .join("");

          byId("gigaSpotlight").innerHTML = data.gigaLiquida
            ? buildGigaSpotlight(data.gigaLiquida)
            : "<article class=\\"section-card\\"><h2>GIGA liquida</h2><p>O ultimo relatorio nao possui bloco GIGA liquida disponivel.</p></article>";
          applyManualSapEnhancements(data);
        }

        async function load() {
          try {
            const response = await fetch(api.data);
            if (!response.ok) {
              const errorText = await response.text();
              renderEmpty("Nao foi possivel carregar os dados do relatorio final." + (errorText ? " " + errorText : ""));
              return;
            }

            const data = await response.json();
            render(data);
          } catch (error) {
            renderEmpty("Falha ao carregar a tela final: " + (error && error.message ? error.message : "erro inesperado"));
          }
        }

        byId("themeSelect").addEventListener("change", function (event) {
          setTheme(event.target.value);
        });

        restoreTheme();
        load();
      })();
    </script>
  </body>
</html>
`;

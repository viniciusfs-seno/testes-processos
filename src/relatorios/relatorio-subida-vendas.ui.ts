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

      .status-bar {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        color: var(--muted);
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
        </div>
      </section>

      <div class="status-bar">
        <span id="lastUpdate">Ultima atualizacao: --</span>
        <span id="jobCount">Jobs: 0</span>
      </div>

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
          status: function (queue, id) {
            return "/relatorios/job/" + queue + "/" + id;
          },
        };

        const state = { last: null, statuses: [] };

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

          jobsEl.innerHTML = "";

          if (!state.last) {
            metaRun.textContent = "Nenhum relatorio registrado";
            metaPeriod.textContent = "Periodo: --";
            jobCount.textContent = "Jobs: 0";
            emptyEl.style.display = "block";
            return;
          }

          emptyEl.style.display = "none";
          metaRun.textContent = "Ultimo disparo: " + state.last.criadoEm;
          metaPeriod.textContent =
            "Periodo: " + state.last.dataIni + " ate " + state.last.dataFim;
          jobCount.textContent = "Jobs: " + state.last.jobs.length;
          lastUpdate.textContent = "Ultima atualizacao: " + new Date().toLocaleTimeString();

          state.last.jobs.forEach(function (job, index) {
            const status = state.statuses[index] || {};
            const badgeClass = statusClass(status.status);
            const summary = buildSummary(status.result);

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
              "<div>" +
              summary +
              "</div>" +
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
          render();
        }

        async function triggerReport() {
          const dataIni = byId("dataIni").value;
          const dataFim = byId("dataFim").value;

          const payload = {};
          if (dataIni) payload.dataIni = dataIni;
          if (dataFim) payload.dataFim = dataFim;

          const res = await fetch(api.start, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            await refreshAll();
          } else {
            alert("Falha ao gerar relatorio.");
          }
        }

        byId("dataIni").value = formatNow();
        byId("dataFim").value = formatNow();
        byId("btnGerar").addEventListener("click", triggerReport);

        refreshAll();
        setInterval(refreshAll, 5000);
      })();
    </script>
  </body>
</html>
`;

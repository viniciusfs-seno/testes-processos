
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(Number(value)) + "%";
        }

        function parseBrCurrency(value) {
          const cleaned = String(value || "")
            .replace(/BRL/gi, "")
            .replace(/s+/g, "")
            .trim();
          if (!cleaned) return null;
          const parsed = Number(cleaned.replace(/./g, "").replace(",", "."));
          return Number.isFinite(parsed) ? parsed : null;
        }

        function buildSummaryCard(title, value, subtitle) {
          return (
            "<article class=\"summary-card\">" +
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
            "<div class=\"section-head\">" +
              "<div class=\"section-title\">" +
                "<h2>" + escapeHtml(section.nome || "Sem nome") + "</h2>" +
                "<p>" + escapeHtml(section.database || "Base nao informada") + "</p>" +
              "</div>" +
              "<div class=\"section-meta\">" +
                "<span class=\"chip status " + escapeHtml(statusClass) + "\">" + escapeHtml(section.status || "waiting") + "</span>" +
                meta.map(function (item) { return "<span class=\"chip\">" + escapeHtml(item) + "</span>"; }).join("") +
              "</div>" +
            "</div>";

          if (section.failedReason) {
            return (
              "<article class=\"section-card\">" + head +
              "<p>" + escapeHtml(section.failedReason) + "</p>" +
              "</article>"
            );
          }

          if (rows.length === 0 || columns.length === 0) {
            return (
              "<article class=\"section-card\">" + head +
              "<p>Nenhum registro disponivel para esta base.</p>" +
              "</article>"
            );
          }

          const table =
            "<div class=\"table-wrap\"><table><thead><tr>" +
            columns.map(function (col) {
              return "<th>" + escapeHtml(col) + "</th>";
            }).join("") +
            "</tr></thead><tbody>" +
            visibleRows.map(function (row) {
              return "<tr>" + columns.map(function (col) {
                const value = row[col];
                const numeric = isNumericCell(value) ? " numeric" : "";
                const rendered = typeof value === "number" ? formatNumber(value) : String(value ?? "--");
                return "<td class=\"" + numeric.trim() + "\">" + escapeHtml(rendered) + "</td>";
              }).join("") + "</tr>";
            }).join("") +
            "</tbody></table></div>";

          return "<article class=\"section-card\">" + head + table + "</article>";
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

        function buildComparativoSection(comparativo, storageKey) {
          const rows = Array.isArray(comparativo.rows) ? comparativo.rows : [];
          const isManual = comparativo.tipo === "manual";
          const rightLabel = comparativo.rightLabel || "BASE_2";
          const leftLabel = comparativo.leftLabel || "BASE_1";

          const totals = isManual
            ? { totalLeft: comparativo.totalLeft || 0, totalRight: null, diferencaTotal: null }
            : {
                totalLeft: comparativo.totalLeft || 0,
                totalRight: comparativo.totalRight || 0,
                diferencaTotal: comparativo.diferencaTotal || 0,
              };

          const meta = [
            "Total " + leftLabel + ": " + formatNumber(totals.totalLeft),
            isManual ? "Preenchimento manual habilitado" : "Total " + rightLabel + ": " + formatNumber(totals.totalRight),
            !isManual ? "Diferenca: " + formatNumber(totals.diferencaTotal) : null,
            !isManual ? "Diferenca %: " + formatPercent(totals.percentualDiferencaTotal) : null,
          ].filter(Boolean);

          const head =
            "<div class=\"section-head\">" +
              "<div class=\"section-title\">" +
                "<h2>" + escapeHtml(comparativo.titulo || "Comparativo") + "</h2>" +
                "<p>" + escapeHtml(comparativo.subtitulo || "") + "</p>" +
              "</div>" +
              "<div class=\"section-meta\">" +
                meta.map(function (item) { return "<span class=\"chip\">" + escapeHtml(item) + "</span>"; }).join("") +
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
                  "<td class=\"numeric\">" + escapeHtml(formatNumber(row.EMPORIUM)) + "</td>" +
                  "<td class=\"input-cell\"><input class=\"manual-input\" data-manual-sap=\"" + escapeHtml(row.rowKey) + "\" data-storage-key=\"" + escapeHtml(storageKey) + "\" value=\"" + escapeHtml(sapValue === null || sapValue === undefined ? "" : String(sapValue)) + "\" placeholder=\"Digite o SAP\" /></td>" +
                  "<td class=\"numeric " + getDifferenceClass(diffValue) + "\">" + escapeHtml(diffValue === null || diffValue === undefined ? "--" : formatNumber(diffValue)) + "</td>" +
                  "<td class=\"numeric " + getDifferenceClass(diffPercent) + "\">" + escapeHtml(formatPercent(diffPercent)) + "</td>" +
                "</tr>"
              );
            }

            return (
              "<tr>" +
                "<td>" + escapeHtml(row.REFERENCIA || "--") + "</td>" +
                "<td class=\"numeric\">" + escapeHtml(formatNumber(row[leftLabel])) + "</td>" +
                "<td class=\"numeric\">" + escapeHtml(formatNumber(row[rightLabel])) + "</td>" +
                "<td class=\"numeric " + getDifferenceClass(row.DIFERENCA) + "\">" + escapeHtml(formatNumber(row.DIFERENCA)) + "</td>" +
                "<td class=\"numeric " + getDifferenceClass(row.DIFERENCA_PERCENTUAL) + "\">" + escapeHtml(formatPercent(row.DIFERENCA_PERCENTUAL)) + "</td>" +
              "</tr>"
            );
          }).join("");

          const pasteTools = isManual
            ? (
                "<div class=\"paste-tools\">" +
                  "<button type=\"button\" class=\"ghost-button\" data-paste-toggle=\"" + escapeHtml(comparativo.id) + "\">Colar SAP</button>" +
                "</div>" +
                "<div class=\"paste-box\" data-paste-box=\"" + escapeHtml(comparativo.id) + "\" hidden>" +
                  "<textarea data-paste-input=\"" + escapeHtml(comparativo.id) + "\" placeholder=\"Cole as 5 linhas do SAP, uma por linha\"></textarea>" +
                  "<div class=\"paste-tools\">" +
                    "<button type=\"button\" class=\"ghost-button\" data-paste-apply=\"" + escapeHtml(comparativo.id) + "\">Aplicar valores</button>" +
                    "<button type=\"button\" class=\"ghost-button\" data-paste-clear=\"" + escapeHtml(comparativo.id) + "\">Limpar</button>" +
                  "</div>" +
                "</div>"
              )
            : "";

          return (
            "<article class=\"section-card\">" +
              head +
              pasteTools +
              "<div class=\"table-wrap\"><table><thead><tr>" +
                headers.map(function (header) {
                  const klass = header === "BANDEIRA" || header === "REFERENCIA"
                    ? ""
                    : header === rightLabel
                      ? "input-head"
                      : "numeric-head";
                  return "<th class=\"" + klass + "\">" + escapeHtml(header.replace("_", " ")) + "</th>";
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
              input.value = savedValues[key];
            }

            const updateDifference = function () {
              const row = input.closest("tr");
              const emporiumCell = row.children[1];
              const diffCell = row.children[3];
              const diffPercentCell = row.children[4];
              const emporiumValue = Number(String(emporiumCell.textContent).replace(/\./g, "").replace(",", "."));
              const typedValue = parseBrCurrency(input.value);
              const hasTypedValue = input.value.trim() !== "" && Number.isFinite(typedValue);
              const diff = hasTypedValue ? emporiumValue - typedValue : null;
              const diffPercent = hasTypedValue && typedValue !== 0 ? (diff / typedValue) * 100 : null;

              diffCell.textContent = diff === null ? "--" : formatNumber(diff);
              diffCell.className = "numeric " + getDifferenceClass(diff);
              diffPercentCell.textContent = formatPercent(diffPercent);
              diffPercentCell.className = "numeric " + getDifferenceClass(diffPercent);

              if (hasTypedValue) {
                savedValues[key] = typedValue;
              } else {
                delete savedValues[key];
              }

              writeSapValues(storageKey, savedValues);
            };

            input.addEventListener("input", updateDifference);
            updateDifference();
          });

          document.querySelectorAll("[data-paste-toggle]").forEach(function (button) {
            button.addEventListener("click", function () {
              const id = button.getAttribute("data-paste-toggle");
              const box = document.querySelector("[data-paste-box='" + id + "']");
              if (!box) return;
              box.hidden = !box.hidden;
            });
          });

          document.querySelectorAll("[data-paste-clear]").forEach(function (button) {
            button.addEventListener("click", function () {
              const id = button.getAttribute("data-paste-clear");
              const textarea = document.querySelector("[data-paste-input='" + id + "']");
              if (textarea) textarea.value = "";
            });
          });

          document.querySelectorAll("[data-paste-apply]").forEach(function (button) {
            button.addEventListener("click", function () {
              const id = button.getAttribute("data-paste-apply");
              const textarea = document.querySelector("[data-paste-input='" + id + "']");
              if (!textarea) return;
              const values = textarea.value
                .split(/?
/)
                .map(function (line) { return parseBrCurrency(line); })
                .filter(function (value) { return value !== null; });

              if (values.length < 5) {
                alert("Cole as 5 linhas do SAP na ordem: GBarbosa, Bretas, Prezunic, Perini, Spid.");
                return;
              }

              const inputs = Array.from(document.querySelectorAll("[data-manual-sap]"));
              inputs.slice(0, 5).forEach(function (input, index) {
                input.value = String(values[index]);
                input.dispatchEvent(new Event("input", { bubbles: true }));
              });
            });
          });
        }

        function buildGigaSpotlight(giga) {
          const resumo = giga && giga.resumoFaixas ? giga.resumoFaixas : {};
          const cards = [
            { title: "Faixa considerada", value: giga && giga.faixaHoras ? giga.faixaHoras.inicio + " ate " + giga.faixaHoras.fim : "--", subtitle: "Somente horarios fechados" },
            { title: "Total ate penultima", value: formatNumber(resumo.totalAtePenultimaFaixa), subtitle: "Acumulado anterior" },
            { title: "Ultima faixa", value: formatNumber(resumo.totalUltimaFaixa), subtitle: "Valor da ultima faixa fechada" },
            { title: "Aumento", value: formatNumber(resumo.diferencaUltimaFaixa), subtitle: "Percentual: " + formatPercent(resumo.percentualUltimaFaixa) },
          ];

          const cardsHtml =
            "<div class=\"giga-summary-grid\">" +
            cards.map(function (card) {
              return "<article class=\"giga-summary-card\"><small>" + escapeHtml(card.title) + "</small><strong>" + escapeHtml(card.value) + "</strong><p>" + escapeHtml(card.subtitle) + "</p></article>";
            }).join("") +
            "</div>";

          return cardsHtml + buildSection(giga, { limit: giga.rows.length });
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
            : "<article class=\"section-card\"><h2>GIGA liquida</h2><p>O ultimo relatorio nao possui bloco GIGA liquida disponivel.</p></article>";
          applyManualSapEnhancements(data);
        }

        async function load() {
          const response = await fetch(api.data);
          if (!response.ok) {
            renderEmpty("Nao foi possivel carregar os dados do relatorio final.");
            return;
          }

          const data = await response.json();
          render(data);
        }

        byId("themeSelect").addEventListener("change", function (event) {
          setTheme(event.target.value);
        });

        restoreTheme();
        load();
      })();
    

# Validacao de GIGA

## Objetivo
Este documento registra os achados reais da investigacao de GIGA no Oracle e a regra que passou a ser usada na consulta principal da API para alinhar os resultados ao RDP.

Referencia principal validada: `2026-04-16`.

## Conclusao
Os valores do RDP batem com a soma em `MAXV_ABCDISTRIBBASE` quando a consulta de GIGA usa:

- `K.QTDEMBALAGEM = 1`
- `DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')`
- `V.DTAHORLANCTO` como base horaria
- universo explicito de lojas do RDP
- segmentos `1, 10, 24, 27, 28, 29, 63`

Os valores deixam de bater quando a consulta principal aplica:

- `V.CHECKOUT > 0`
- dependencia de `PDV_DOCTO`

Por isso, a consulta principal de GIGA (`LIQUIDA` e `BRUTA`) foi simplificada para seguir o mesmo criterio que bateu com o RDP.

## Tabelas relevantes
- `MAXV_ABCDISTRIBBASE`
  - base principal de vendas usada na conciliacao
  - campos uteis: `DTAVDA`, `DTAHORLANCTO`, `NROEMPRESA`, `NROSEGMENTO`, `CHECKOUT`, `NRODOCTO`, `VLRITEM`, `VLRDEVOLITEM`, `VLRITEMSEMDESC`, `VLRDEVOLITEMSEMDESC`, `TIPTABELA`, `CGOACMCOMPRAVENDA`, `ACMCOMPRAVENDA`, `CODGERALOPER`
- `MAX_EMPRESA`
  - cadastro real de lojas
  - campos uteis: `NROEMPRESA`, `STATUS`, `NOMEREDUZIDO`, `FANTASIA`, `RAZAOSOCIAL`, `NRODIVISAO`
- `VPALM_SEGMENTO`
  - cadastro real de segmentos
  - campos uteis: `NROSEGMENTO`, `DESCSEGMENTO`, `STATUS`
- `PDV_DOCTO`
  - tabela investigada durante a divergencia
  - campos uteis: `NROEMPRESA`, `DTAMOVIMENTO`, `NUMERODF`, `NROCHECKOUT`, `DTAHORAMOVTO`
  - conclusao: foi util para diagnostico, mas nao entra mais como filtro central da consulta principal de GIGA

## O que e PDV_DOCTO
`PDV_DOCTO` e a tabela de documentos do PDV no Consinco. Ela representa o documento operacional da venda, como o cupom ou registro equivalente do caixa.

Na investigacao de GIGA, ela aparecia na logica antiga para:

- casar a venda de `MAXV_ABCDISTRIBBASE` com um documento de PDV;
- usar a hora do movimento via `PD.DTAHORAMOVTO`;
- reforcar a validacao operacional do registro.

O casamento era feito assim:

- `V.NROEMPRESA = PD.NROEMPRESA`
- `V.DTAVDA = PD.DTAMOVIMENTO`
- `V.CHECKOUT = PD.NROCHECKOUT`
- `V.NRODOCTO = PD.NUMERODF`

Na pratica, a consulta antiga assumia:

- so entra a venda que conseguir casar com `PDV_DOCTO`;
- e, no fluxo antigo, ainda precisava passar por `V.CHECKOUT > 0`.

O problema e que isso nao refletiu o comportamento real do RDP para GIGA. Encontramos vendas validas em `MAXV_ABCDISTRIBBASE` com:

- valor correto;
- `DTAHORLANCTO` preenchida;
- mas sem correspondencia util em `PDV_DOCTO`, ou com `CHECKOUT = 0`.

Resumo pratico:

- `MAXV_ABCDISTRIBBASE` = onde a venda estava registrada;
- `PDV_DOCTO` = documento operacional do PDV;
- para GIGA, usar `PDV_DOCTO` como filtro principal fazia a API perder vendas que o RDP considerava validas.

## Lojas reais confirmadas no banco
Universo explicito do RDP validado em `MAX_EMPRESA`:

| Codigo | Nome reduzido | Fantasia | Status |
| --- | --- | --- | --- |
| 101 | G01-LIMAO | GIGA LIMAO | A |
| 102 | G02-TAMBORE | GIGA ARAGUAIA | A |
| 103 | G07-CACHOEIRINH | GIGA CACHOEIRINHA | A |
| 105 | G03-RAPOSO | GIGA RAPOSO | A |
| 106 | G04-JUNDIAI | GIGA JUNDIAI | A |
| 107 | G05-CARAPICUIBA | GIGA CARAPICUIBA | A |
| 108 | G06-BARRA FUNDA | GIGA BARRA FUNDA | A |
| 109 | G08-GUARULHOS | GIGA GUARULHOS | A |
| 112 | G10-VENDA EXTERNA | GIGA VENDA EXTERNA | A |
| 113 | G12-NACOES UNID | GIGA NACOES UNIDAS | A |
| 114 | G13-SAO BERNARD | GIGA SAO BERNARDO | A |
| 115 | G11-CAMPINAS | GIGA CAMPINAS | A |
| 116 | G14-CAMPINAS VE | GIGA CAMPINAS VENDA EXTERNA | A |
| 117 | G17-SOROCABA | GIGA SOROCABA | A |
| 300 | GC01-VARZEA | GIGA COMPACTO VARZEA PAULISTA | A |
| 301 | GC02-OSASCO | GIGA COMPACTO OSASCO | A |
| 304 | G09-TREMEMBE | GIGA TREMEMBE | A |

## Segmentos reais relevantes
Achados em `VPALM_SEGMENTO`:

| Codigo | Descricao | Status | Observacao |
| --- | --- | --- | --- |
| 1 | ATACADO | A | segmento principal de GIGA |
| 10 | TELEVENDAS | A | segmento principal de GIGA |
| 24 | RAPPI | A | segmento principal de GIGA |
| 27 | IFOOD B2C | A | segmento principal de GIGA |
| 28 | VENDA EXTERNA | A | segmento observado para G10 e G14 |
| 29 | GIGA-E-COMMERCE | A | segmento principal de GIGA |
| 63 | MA-VENDA EXT BA | A | existe no banco e continua no conjunto padrao |
| 64 | MA-VENDA EXT SE | I | segmento inativo |

## Regra principal atual da API

### LIQUIDA
- criterio de valor: `ROUND(NVL(V.VLRITEM, 0), 2) - ROUND(NVL(V.VLRDEVOLITEM, 0), 2)`
- data/hora: `V.DTAHORLANCTO`
- sem `JOIN` em `PDV_DOCTO`
- sem `V.CHECKOUT > 0`

### BRUTA
- criterio de valor: `ROUND(NVL(V.VLRITEMSEMDESC, 0), 2) - ROUND(NVL(V.VLRDEVOLITEMSEMDESC, 0), 2)`
- data/hora: `V.DTAHORLANCTO`
- sem `JOIN` em `PDV_DOCTO`
- sem `V.CHECKOUT > 0`

### RDP_SIMILAR
- mantido separado por semantica
- criterio de valor: `ROUND(NVL(V.VLRITEM, 0), 2)`
- data/hora: `V.DTAHORLANCTO`

## Filtros principais que batem com o RDP
- lojas: universo explicito do RDP em `MAX_EMPRESA`
- segmentos padrao de GIGA: `1, 10, 24, 27, 28, 29, 63`
- `K.QTDEMBALAGEM = 1`
- `DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')`
- base horaria: `V.DTAHORLANCTO`

## Evidencias validadas no banco em 2026-04-16

### Totais por loja que bateram com o RDP

| Codigo | Loja | Valor |
| --- | --- | ---: |
| 101 | G01-LIMAO | 639.658,24 |
| 102 | G02-TAMBORE | 364.994,41 |
| 103 | G07-CACHOEIRINH | 325.488,61 |
| 105 | G03-RAPOSO | 285.711,65 |
| 106 | G04-JUNDIAI | 280.398,48 |
| 107 | G05-CARAPICUIBA | 453.666,79 |
| 108 | G06-BARRA FUNDA | 361.482,93 |
| 109 | G08-GUARULHOS | 71.351,80 |
| 112 | G10-VENDA EXTERNA | 327.319,51 |
| 113 | G12-NACOES UNID | 264.141,06 |
| 115 | G11-CAMPINAS | 43.189,73 |
| 116 | G14-CAMPINAS VE | 179.776,65 |
| 300 | GC01-VARZEA | 178.987,03 |
| 301 | GC02-OSASCO | 168.074,85 |
| 304 | G09-TREMEMBE | 146.372,40 |

### Totais por segmento que bateram com o RDP

| Codigo | Segmento | Valor |
| --- | --- | ---: |
| 1 | ATACADO | 3.060.068,19 |
| 10 | TELEVENDAS | 434.315,17 |
| 24 | RAPPI | 237,31 |
| 27 | IFOOD B2C | 64.287,63 |
| 28 | VENDA EXTERNA | 507.096,16 |
| 29 | GIGA-E-COMMERCE | 24.609,68 |

## O que explicava a divergencia antiga
- `PDV_DOCTO` e `V.CHECKOUT > 0` tiravam da consulta principal linhas que existiam em `MAXV_ABCDISTRIBBASE`
- isso afetava tanto `G10` e `G14` quanto as demais lojas
- `G10` (`112`) e `G14` (`116`) confirmaram o problema de forma mais visivel porque suas vendas estavam no segmento `28 = VENDA EXTERNA`
- em `2026-04-16`, a loja `112` teve `327.319,51` e a `116` teve `179.776,65`, ambas visiveis na regra simplificada

## Checklist de validacao
- conferir lojas elegiveis, com venda e sem venda
- conferir segmentos do conjunto padrao e o universo completo de segmentos possiveis
- conferir totais por loja e por segmento para `2026-04-16`
- conferir faixas horarias no padrao `HH:00-HH:59`

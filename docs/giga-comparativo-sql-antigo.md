# GIGA: Comparativo entre o SQL antigo e a consulta atual

## Objetivo
Este documento resume a diferenca entre:

- o SQL antigo de GIGA, que era uma adaptacao direta da consulta de Mercantil no Consinco;
- a consulta atual de GIGA na API, ajustada para reproduzir o comportamento do RDP.

Referencia principal de validacao: `2026-04-16`.

## SQL antigo
O SQL antigo seguia esta linha:

- base principal: `MAXV_ABCDISTRIBBASE`
- valor: `ROUND(V.VLRITEM, 2) - ROUND(V.VLRDEVOLITEM, 2)`
- lojas: `V.NROEMPRESA BETWEEN 101 AND 149`
- segmentos:
  - `51, 52, 53, 54, 55, 56, 59, 61, 62, 63, 57, 27, 1, 10, 29, 24`
- filtros estruturais:
  - `K.QTDEMBALAGEM = 1`
  - `DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')`
  - `V.CHECKOUT > 0`
- agrupamento por dia:
  - `GROUP BY V.DTAVDA`

## Consulta atual de GIGA
Hoje a API usa uma regra propria para GIGA:

- base principal: `MAXV_ABCDISTRIBBASE`
- valor liquido:
  - `ROUND(NVL(V.VLRITEM, 0), 2) - ROUND(NVL(V.VLRDEVOLITEM, 0), 2)`
- valor bruto:
  - `ROUND(NVL(V.VLRITEMSEMDESC, 0), 2) - ROUND(NVL(V.VLRDEVOLITEMSEMDESC, 0), 2)`
- base horaria:
  - `V.DTAHORLANCTO`
- lojas:
  - lista explicita das lojas do RDP:
    - `101, 102, 103, 105, 106, 107, 108, 109, 112, 113, 114, 115, 116, 117, 300, 301, 304`
- segmentos padrao:
  - `1, 10, 24, 27, 28, 29, 63`
- filtros estruturais preservados:
  - `K.QTDEMBALAGEM = 1`
  - `DECODE(V.TIPTABELA, 'S', V.CGOACMCOMPRAVENDA, V.ACMCOMPRAVENDA) IN ('S', 'I')`
- filtros removidos da regra principal:
  - sem `V.CHECKOUT > 0`
  - sem `JOIN` em `PDV_DOCTO`

## Diferencas principais

### 1. Universo de lojas
No SQL antigo:

- usava `V.NROEMPRESA BETWEEN 101 AND 149`
- isso era um recorte generico
- nem todas as lojas desse intervalo eram necessariamente lojas do RDP
- e algumas lojas reais de interesse de GIGA ficam melhor representadas por uma lista explicita

Na consulta atual:

- a API usa o universo explicito de lojas do RDP
- isso elimina ambiguidade e deixa a consulta aderente ao relatorio de negocio

Conclusao:
- no antigo, o filtro de lojas era amplo e herdado do Mercantil;
- no atual, o filtro de lojas foi modelado especificamente para GIGA.

### 2. Universo de segmentos
No SQL antigo:

- usava uma lista herdada do Mercantil:
  - `51, 52, 53, 54, 55, 56, 59, 61, 62, 63, 57, 27, 1, 10, 29, 24`
- essa lista misturava segmentos de outras operacoes com parte do universo real de GIGA
- nao incluia o segmento `28 = VENDA EXTERNA`

Na consulta atual:

- os segmentos padrao foram ajustados para o universo validado do RDP:
  - `1 = ATACADO`
  - `10 = TELEVENDAS`
  - `24 = RAPPI`
  - `27 = IFOOD B2C`
  - `28 = VENDA EXTERNA`
  - `29 = GIGA-E-COMMERCE`
  - `63 = MA-VENDA EXT BA`

Conclusao:
- o antigo deixava de fora `28`, que foi exatamente o segmento onde apareceram as vendas de `G10` e `G14`;
- o atual usa o conjunto validado no banco e no RDP.

### 3. Filtro `V.CHECKOUT > 0`
No SQL antigo:

- havia `AND V.CHECKOUT > 0`

Problema encontrado:

- varias vendas reais de GIGA existem em `MAXV_ABCDISTRIBBASE`, mas com `CHECKOUT = 0`
- isso foi especialmente visivel em:
  - `112 = G10-VENDA EXTERNA`
  - `116 = G14-CAMPINAS VE`

Efeito:

- essas linhas eram excluidas da soma
- por isso o total da API antiga ficava abaixo do RDP

Na consulta atual:

- `V.CHECKOUT > 0` saiu da regra principal de GIGA

Conclusao:
- esse filtro fazia sentido no contexto antigo herdado de Mercantil;
- para GIGA, ele removia vendas legitimas e era uma das causas principais da divergencia.

### 4. Dependencia de `PDV_DOCTO`
No fluxo antigo derivado de Mercantil:

- a data/hora e parte da consistencia da venda eram tratadas via `PDV_DOCTO`
- isso fazia sentido para o modelo antigo, mas nao refletia o comportamento observado no RDP para GIGA

Problema encontrado:

- ao depender de `PDV_DOCTO`, a consulta eliminava registros de venda existentes em `MAXV_ABCDISTRIBBASE`
- isso acontecia junto do problema de `CHECKOUT = 0`

Na consulta atual:

- GIGA usa `V.DTAHORLANCTO` diretamente
- `PDV_DOCTO` ficou apenas como tabela relevante de investigacao, nao como filtro principal

Conclusao:
- `PDV_DOCTO` ajudou a explicar a divergencia, mas nao representa a regra correta para o fechamento de GIGA que bate com o RDP.

### 5. Base horaria
No SQL antigo:

- a consulta mostrada era agrupada por dia
- ela nao foi pensada originalmente para o comportamento horario especifico de GIGA

Na consulta atual:

- a base horaria eh `V.DTAHORLANCTO`
- as faixas sao apresentadas no padrao do RDP:
  - `HH:00-HH:59`

Conclusao:
- a consulta atual nao so fecha o total do dia, como tambem segue a mesma leitura horaria do RDP.

## Por que o SQL antigo nao dava o valor certo
O SQL antigo nao errava por um unico motivo. O problema era a combinacao destes fatores:

1. Herdava o universo de segmentos do Mercantil, e nao o universo real de GIGA.
2. Nao incluia `28 = VENDA EXTERNA`.
3. Aplicava `V.CHECKOUT > 0`, removendo vendas legitimas.
4. Mantinha uma estrutura conceitualmente derivada do fluxo antigo de Mercantil, enquanto o RDP de GIGA batia direto em `MAXV_ABCDISTRIBBASE`.

Em outras palavras:

- o SQL antigo era coerente como adaptacao rapida;
- mas nao representava a regra real usada pelo RDP para GIGA.

## Por que a consulta nova da certo
A consulta nova passou a bater com o RDP porque foi definida a partir de evidencia no banco, nao por reaproveitamento de Mercantil.

Linha de raciocinio usada:

1. Confirmar no banco quais lojas realmente fazem parte do universo de GIGA no RDP.
2. Confirmar em `VPALM_SEGMENTO` quais segmentos reais apareciam nas vendas.
3. Comparar os totais do RDP com somas diretas em `MAXV_ABCDISTRIBBASE`.
4. Testar a consulta com e sem:
   - `V.CHECKOUT > 0`
   - `PDV_DOCTO`
   - segmentos herdados do Mercantil
5. Verificar qual combinacao reproduzia exatamente os totais por loja e por segmento.

Resultado:

- a combinacao que bateu com o RDP foi:
  - `MAXV_ABCDISTRIBBASE`
  - `K.QTDEMBALAGEM = 1`
  - `DECODE(... ) IN ('S', 'I')`
  - `V.DTAHORLANCTO`
  - lojas explicitas do RDP
  - segmentos `1, 10, 24, 27, 28, 29, 63`
  - sem `V.CHECKOUT > 0`
  - sem `PDV_DOCTO`

## Evidencia pratica de 2026-04-16
Com a regra nova, os seguintes valores bateram com o RDP:

### Lojas
- `101 = 639.658,24`
- `102 = 364.994,41`
- `103 = 325.488,61`
- `105 = 285.711,65`
- `106 = 280.398,48`
- `107 = 453.666,79`
- `108 = 361.482,93`
- `109 = 71.351,80`
- `112 = 327.319,51`
- `113 = 264.141,06`
- `115 = 43.189,73`
- `116 = 179.776,65`
- `300 = 178.987,03`
- `301 = 168.074,85`
- `304 = 146.372,40`

### Segmentos
- `ATACADO = 3.060.068,19`
- `TELEVENDAS = 434.315,17`
- `RAPPI = 237,31`
- `IFOOD B2C = 64.287,63`
- `VENDA EXTERNA = 507.096,16`
- `GIGA-E-COMMERCE = 24.609,68`

## Resumo executivo
- o SQL antigo de GIGA era uma adaptacao do Mercantil e por isso herdava filtros e segmentos que nao representavam o comportamento real do RDP;
- os principais responsaveis pela divergencia eram:
  - segmentos errados ou incompletos;
  - ausencia do segmento `28 = VENDA EXTERNA`;
  - filtro `V.CHECKOUT > 0`;
  - dependencia conceitual de `PDV_DOCTO`;
- a consulta nova foi definida a partir dos dados reais do banco e passou a reproduzir exatamente o RDP para `2026-04-16`.

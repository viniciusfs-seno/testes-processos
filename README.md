# Testes Processos

API NestJS usada para consultas, validacoes e relatorios. Este clone local roda no Windows e reutiliza um Redis ja existente no host para as filas Bull.

## Setup local

```bash
npm install
npm run start:dev
```

Por padrao, esta copia do projeto usa o Redis compartilhado ja em execucao no ambiente local. Nao suba um segundo container Redis para este clone se o `meu-redis` ja estiver ativo.

## Variaveis de ambiente

O projeto le configuracoes do arquivo `.env`. Para o Redis compartilhado local, use:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

As demais variaveis de banco podem continuar apontando para os ambientes ja usados pelo projeto original.

## Redis compartilhado

Esta pasta e uma copia do projeto original e pode reaproveitar o mesmo container Redis do ambiente, por exemplo `meu-redis`.

- Recomendado: manter apenas um Redis local em `localhost:6379`.
- Nao recomendado: subir outro Redis com bind `6379:6379` a partir deste clone.
- Se voce realmente precisar de um Redis separado para isolar dados, publique outra porta no host, como `6380:6379`.

## Validacao rapida

Depois de configurar o `.env` e garantir que o Redis compartilhado esta de pe:

```bash
npm run start:dev
```

Validacoes esperadas:

- a aplicacao sobe sem erro de conexao com Redis
- as filas Bull inicializam normalmente
- um fluxo que usa fila, como a geracao de relatorio, consegue enfileirar jobs

## Troubleshooting

### Erro `failed to bind host port 0.0.0.0:6379/tcp: address already in use`

Esse erro quase sempre significa que voce tentou subir um segundo Redis local na mesma porta `6379`.

Como resolver:

- mantenha o `meu-redis` existente e nao crie outro Redis neste clone
- confirme que a aplicacao esta apontando para `REDIS_HOST=localhost` e `REDIS_PORT=6379`
- se precisar de outro Redis, troque a porta publicada do novo container para algo como `6380:6379`

## Scripts uteis

```bash
# desenvolvimento
npm run start
npm run start:dev
npm run start:prod

# testes
npm run test
npm run test:e2e
npm run test:cov
```

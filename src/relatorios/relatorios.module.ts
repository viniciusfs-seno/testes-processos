import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { Db1Client } from './db1.client';
import { Db2Client } from './db2.client';
import { Db3Client } from './db3.client';
import { Db4Client } from './db4.client';
import { Db5Client } from './db5.client';
import { Db1Processor } from './processors/db1.processor';
import { Db2Processor } from './processors/db2.processor';
import { Db3Processor } from './processors/db3.processor';
import { Db4Processor } from './processors/db4.processor';
import { Db5Processor } from './processors/db5.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Este clone local reutiliza o Redis compartilhado do ambiente
        // (por padrao em localhost:6379), sem exigir um novo container aqui.
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: Number(configService.get<string>('REDIS_PORT', '6379')),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // 5 filas registradas
    BullModule.registerQueue(
      { name: 'db1-relatorios' },
      { name: 'db2-relatorios' },
      { name: 'db3-relatorios' },
      { name: 'db4-relatorios' },
      { name: 'db5-relatorios' },
    ),

    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    BullBoardModule.forFeature({ name: 'db1-relatorios', adapter: BullAdapter }),
    BullBoardModule.forFeature({ name: 'db2-relatorios', adapter: BullAdapter }),
    BullBoardModule.forFeature({ name: 'db3-relatorios', adapter: BullAdapter }),
    BullBoardModule.forFeature({ name: 'db4-relatorios', adapter: BullAdapter }),
    BullBoardModule.forFeature({ name: 'db5-relatorios', adapter: BullAdapter }),
  ],
  providers: [
    RelatoriosService,
    Db1Client,
    Db2Client,
    Db3Client,
    Db4Client,
    Db5Client,
    Db1Processor,
    Db2Processor,
    Db3Processor,
    Db4Processor,
    Db5Processor,
  ],
  controllers: [RelatoriosController],
})
export class RelatoriosModule {}

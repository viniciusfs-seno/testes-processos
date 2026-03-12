import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestDbModule } from './test-db/test-db.module';
import { RelatoriosModule } from './relatorios/relatorios.module';

@Module({
  imports: [
    // Importa o ConfigModule para usar variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true, // torna disponível em toda aplicação
    }),

    /* COMENTADO TEMPORARIAMENTE - erro RangeError: Invalid key length
    // Conexão 1 (default) - com SID
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DB1_HOST'),
        port: Number(configService.get<string>('DB1_PORT')),
        username: configService.get<string>('DB1_USER'),
        password: configService.get<string>('DB1_PASS'),
        sid: configService.get<string>('DB1_SID'),
        synchronize: false,
        logging: true,
      }),
    }),

    // Conexão 2 - com Service Name
    TypeOrmModule.forRootAsync({
      name: 'EmporiumAtacado',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DB2_HOST'),
        port: Number(configService.get<string>('DB2_PORT')),
        username: configService.get<string>('DB2_USER'),
        password: configService.get<string>('DB2_PASS'),
        serviceName: configService.get<string>('DB2_SERVICE_NAME'),
        synchronize: false,
        logging: true,
      }),
    }),

    // Conexão 3 - com Service Name
    TypeOrmModule.forRootAsync({
      name: 'CONSINCO',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DB3_HOST'),
        port: Number(configService.get<string>('DB3_PORT')),
        username: configService.get<string>('DB3_USER'),
        password: configService.get<string>('DB3_PASS'),
        serviceName: configService.get<string>('DB3_SERVICE_NAME'),
        synchronize: false,
        logging: true,
      }),
    }),
    */

    TestDbModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

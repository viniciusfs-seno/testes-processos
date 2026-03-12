import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/debug-env')
  debugEnv() {
    return {
      // DB1 - Oracle SID
      DB1_HOST: this.configService.get('DB1_HOST'),
      DB1_PORT: this.configService.get('DB1_PORT'),
      DB1_USER: this.configService.get('DB1_USER'),
      DB1_PASS: this.configService.get('DB1_PASS') ? '***EXISTE***' : 'VAZIO',
      DB1_SID: this.configService.get('DB1_SID'),

      // DB2 - Oracle ServiceName
      DB2_HOST: this.configService.get('DB2_HOST'),
      DB2_USER: this.configService.get('DB2_USER'),
      DB2_PASS: this.configService.get('DB2_PASS') ? '***EXISTE***' : 'VAZIO',
      DB2_SERVICE_NAME: this.configService.get('DB2_SERVICE_NAME'),

      // DB3 - Oracle ServiceName
      DB3_HOST: this.configService.get('DB3_HOST'),
      DB3_USER: this.configService.get('DB3_USER'),
      DB3_PASS: this.configService.get('DB3_PASS') ? '***EXISTE***' : 'VAZIO',
      DB3_SERVICE_NAME: this.configService.get('DB3_SERVICE_NAME'),

      // DB4 - MySQL
      DB4_HOST: this.configService.get('DB4_HOST'),
      DB4_PORT: this.configService.get('DB4_PORT'),
      DB4_USER: this.configService.get('DB4_USER'),
      DB4_PASS: this.configService.get('DB4_PASS') ? '***EXISTE***' : 'VAZIO',
      DB4Context_DB: this.configService.get('DB4Context_DB'),

      // DB5 - Oracle connectString
      DB5_CONN_STRING: this.configService.get('DB5_CONN_STRING'),
      DB5_USER: this.configService.get('DB5_USER'),
      DB5_PASS: this.configService.get('DB5_PASS') ? '***EXISTE***' : 'VAZIO',
    };
  }
}

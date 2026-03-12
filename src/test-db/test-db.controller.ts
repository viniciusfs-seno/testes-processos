import { Controller, Get } from '@nestjs/common';
import { TestDbService } from './test-db.service';

@Controller('test-db')
export class TestDbController {
  constructor(private readonly testDbService: TestDbService) {}

  @Get('db1')
  async testDB1() { return this.testDbService.testDB1(); }

  @Get('db2')
  async testDB2() { return this.testDbService.testDB2(); }

  @Get('db3')
  async testDB3() { return this.testDbService.testDB3(); }

  @Get('db4')
  async testDB4() { return this.testDbService.testDB4(); }

  @Get('db5')
  async testDB5() { return this.testDbService.testDB5(); }

  @Get('all')
  async testAll() { return this.testDbService.testAll(); }
}

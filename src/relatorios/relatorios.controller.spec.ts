import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosController', () => {
  let controller: RelatoriosController;
  let service: jest.Mocked<
    Pick<
      RelatoriosService,
      | 'resumoDb3VendasGiga'
      | 'resumoDb3VendasGigaBruta'
      | 'resumoDb3VendasGigaRdp'
      | 'getRelatorioSubidaVendasFinalData'
      | 'getGigaValidacaoData'
    >
  >;

  beforeEach(async () => {
    service = {
      resumoDb3VendasGiga: jest.fn(),
      resumoDb3VendasGigaBruta: jest.fn(),
      resumoDb3VendasGigaRdp: jest.fn(),
      getRelatorioSubidaVendasFinalData: jest.fn(),
      getGigaValidacaoData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [
        {
          provide: RelatoriosService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<RelatoriosController>(RelatoriosController);
  });

  it('usa a consulta giga liquida na rota atual', async () => {
    const dto = { dataIni: '2026-04-16', dataFim: '2026-04-16' };

    await controller.vendasConsincoResumoGiga(dto);

    expect(service.resumoDb3VendasGiga).toHaveBeenCalledWith(dto);
  });

  it('usa a consulta giga bruta na nova rota', async () => {
    const dto = { dataIni: '2026-04-16', dataFim: '2026-04-16' };

    await controller.vendasConsincoResumoGigaBruta(dto);

    expect(service.resumoDb3VendasGigaBruta).toHaveBeenCalledWith(dto);
  });

  it('usa a consulta giga rdp na nova rota dedicada', async () => {
    const dto = { dataIni: '2026-04-16', dataFim: '2026-04-16' };

    await controller.vendasConsincoResumoGigaRdp(dto);

    expect(service.resumoDb3VendasGigaRdp).toHaveBeenCalledWith(dto);
  });

  it('retorna a tela html do relatorio final', () => {
    const html = controller.relatorioSubidaVendasFinalUi();

    expect(html).toContain('Relatorio Final Consolidado');
    expect(html).toContain('themeSelect');
  });

  it('delegates final data to the service', async () => {
    service.getRelatorioSubidaVendasFinalData.mockResolvedValue({ encontrado: false, pronto: false });

    const result = await controller.relatorioSubidaVendasFinalData();

    expect(service.getRelatorioSubidaVendasFinalData).toHaveBeenCalled();
    expect(result).toEqual({ encontrado: false, pronto: false });
  });

  it('retorna a tela html da validacao de giga', () => {
    const html = controller.gigaValidacaoUi();

    expect(html).toContain('Validacao GIGA');
    expect(html).toContain('/relatorios/giga-validacao/data');
  });

  it('delegates giga validation data to the service', async () => {
    const dto = { dataIni: '2026-04-17', dataFim: '2026-04-17' };
    service.getGigaValidacaoData.mockResolvedValue({ periodo: { inicio: '2026-04-17', fim: '2026-04-17' } });

    const result = await controller.gigaValidacaoData(dto as any);

    expect(service.getGigaValidacaoData).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ periodo: { inicio: '2026-04-17', fim: '2026-04-17' } });
  });
});

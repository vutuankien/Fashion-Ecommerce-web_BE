import { Test, TestingModule } from '@nestjs/testing';
import { FollowShopService } from './follow-shop.service';

describe('FollowShopService', () => {
  let service: FollowShopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowShopService],
    }).compile();

    service = module.get<FollowShopService>(FollowShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

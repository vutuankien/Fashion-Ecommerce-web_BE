import { Test, TestingModule } from '@nestjs/testing';
import { FollowShopController } from './follow-shop.controller';
import { FollowShopService } from './follow-shop.service';

describe('FollowShopController', () => {
  let controller: FollowShopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowShopController],
      providers: [FollowShopService],
    }).compile();

    controller = module.get<FollowShopController>(FollowShopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

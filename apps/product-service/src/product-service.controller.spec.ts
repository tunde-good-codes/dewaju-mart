import { Test, TestingModule } from '@nestjs/testing';
import { ProductServiceController } from './product-service.controller';
import { ProductService } from './product-service.service';

describe('ProductServiceController', () => {
  let productServiceController: ProductServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProductServiceController],
      providers: [ProductService],
    }).compile();

    productServiceController = app.get<ProductServiceController>(ProductServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(productServiceController.getHello()).toBe('Hello World!');
    });
  });
});

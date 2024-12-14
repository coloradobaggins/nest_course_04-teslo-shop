import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ) {}

  async runSeed() {
    await this.insertSeedProducts();
    return `execute seed!`;
  }

  private async insertSeedProducts() {
    await this.productsService.removeAllProducts();
    return true;
  }
}

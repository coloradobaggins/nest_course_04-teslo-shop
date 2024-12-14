import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

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

    const seedProducts = initialData.products;

    const seedInsertPromises = [];

    seedProducts.forEach(product => {
      seedInsertPromises.push(this.productsService.create(product));
    });

    //const seedInsertResult = await Promise.all(seedInsertPromises);
    await Promise.all(seedInsertPromises);

    return true;
  }
}

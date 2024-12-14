import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsModule } from 'src/products/products.module';
import { ProductsService } from 'src/products/products.service';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [ProductsModule],  // ** ProductsModule exporta el servicio. Seed importa el modulo.. **

})
export class SeedModule {}

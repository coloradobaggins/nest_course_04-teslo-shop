import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { off, title } from 'process';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger: Logger = new Logger(ProductsService.name);

  constructor(
    //productRepository va a manejar el repository de mi producto
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {

    try{

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;

    }catch(err){
      //console.error(err.code); 

      if(err.code === '23505')
        throw new BadRequestException(err.detail)
      
      this.logger.error(err);
      throw new InternalServerErrorException(`Error creando producto. Check logs...`);
    }

  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset= 0 } = paginationDto;

    this.logger.log(`LIMIT: ${limit} - offset: ${offset}`);

    return await this.productRepository.find({
      take: limit,
      skip: offset,
      //Relations..
    });
  }

  async findOne(term: string) {
    console.log(`On FindOne !!`);

    let product: Product;

    console.log(`term: ${term}`);

    if(isUUID(term)){
      console.log(`FIND BY ID!`)
      product = await this.productRepository.findOneBy({id: term});
    }else{
      console.log(`Vamos por query Builder`);
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        }).getOne();
    }
    
    if(!product)
      throw new BadRequestException(`Producto no encontrado bajo este parametro de busqueda`)
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;    
  }

  async remove(idProd: string) {
    try{
      const deleteProd = await this.productRepository.delete({id: idProd});
      this.logger.log(`${idProd} -> deleted`);
      
      if(deleteProd.affected === 0)
        throw new BadRequestException(`${idProd} no fue encontrado`);

      return `${idProd} deleted`;

    }catch(err){
      this.logger.error(err);
      throw new HttpException({
        statusCode: err?.status || 500, 
        status: `Error`,
        message: err?.message || `Error eliminando ${idProd}`
      }, err?.status || 500)
    }
  }
}

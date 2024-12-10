import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger: Logger = new Logger(ProductsService.name);

  constructor(
    //productRepository va a manejar el repository de mi producto
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource, // (obtiene datos de conexion. Misma config que el repositorio)
  ) {}

  async create(createProductDto: CreateProductDto) {

    try{

      const { images = [], ...productDetail } = createProductDto; //rest operator, resto de variables las devuelvo en productDetail

      //const product = this.productRepository.create(createProductDto);
      //TypeORM infiere que ademas de crear el producto, las imagenes que paso corresponden al mismo.
      const product = this.productRepository.create({
        ...productDetail,
        images: images.map( imgUrl => this.productImageRepository.create({ url: imgUrl }))
      });
      await this.productRepository.save(product); //Salva producto como imgs

      return {
        ...product,
        images
      }

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

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    })

    return products.map( (product) => ({
      ...product,
      images: product.images.map(img => img.url),
    }))
    
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
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); //alias a tabla 'prod'
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')  //get images
        .getOne();
    }
    
    if(!product)
      throw new BadRequestException(`Producto no encontrado bajo este parametro de busqueda`)
    
    //return product;
    return {
      ...product,
      images: product.images.map((img) => img.url),
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    console.log(updateProductDto);

    const { images, ...prodDetails } = updateProductDto

    //Preload, busca por id y pone las propiedades que enviamos para actualizar. No lo actualiza, lo busca y prepara.
    const product = await this.productRepository.preload({
      id: id,
      ...prodDetails,
    });

    if(!product)
      throw new NotFoundException(`Product id ${id} not found`);

    //Transacacciones
    //Query runner, definimos el procedimientos de commits..
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      //Si vienen imgs borramos las actuales primero.
      if(images){

        await queryRunner.manager.delete(ProductImage, { product: { id: id } }) //product es la relacion de ProductImage entity con Product, y matchea el id con el id de producto que viene.
        
        product.images = images.map( img => this.productImageRepository.create({url: img}) )

      }

      await queryRunner.manager.save(product); //Intenta grabarlo, aun no impacta en db.
      
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOne(id)

    }catch(err){
      this.logger.error(err);

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw new BadRequestException(`Error. ${err?.message}`)
    }
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

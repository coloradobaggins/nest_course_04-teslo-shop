import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductImage{

  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  //Relacion a product (entity)
  @ManyToOne(
    () => Product, //Callback que regresa a clase que crea la entidad  
    (product) => product.images // Product se va a relacionar con ...
  )
  product: Product;
}
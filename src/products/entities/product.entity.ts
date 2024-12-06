import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  title: string;

  @Column('float', {
    default: 0,
  })
  price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column('text', {
    unique: true,
  })
  slug: string;

  @Column('int', {
    default: 0,
  })
  stock: number;

  @Column('text', {
    array: true,
  })
  sizes: string[];

  @Column('text')
  gender: string;

  @Column('text', {
    array: true,
    default: []
  })
  tags: string[];

  //Imagenes
  @OneToMany(
    () => ProductImage, //el callback regresa un product image
    (productImage) => productImage.product,    //Relacion
    { cascade: true }
  )
  images?: ProductImage;

  @BeforeInsert()
  checkSlugBeforeInsert() {
    console.log(`on Before Insert`);
    console.log(this.slug)
    if(!this.slug)
      this.slug = this.title
    
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ','_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugBeforeUpdate() {
  
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}

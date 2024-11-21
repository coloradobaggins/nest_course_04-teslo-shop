import { IsOptional } from "class-validator";

export class FindProductDto {
    @IsOptional()
    id: string;

    @IsOptional()
    slug: string;
}
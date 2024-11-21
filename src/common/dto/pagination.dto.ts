import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {
    @IsOptional()
    @IsPositive()
    @Type(() => Number) //Por queryParam viene todo en string. Convierto a Number.
    limit?: number;

    @IsOptional()
    @Min(0)
    @Type(()=> Number)
    offset?: number;
}
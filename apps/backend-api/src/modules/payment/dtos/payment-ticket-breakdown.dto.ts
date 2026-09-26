import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsUUID, Min } from "class-validator";

export class PaymentTicketBreakdownDto {
  @ApiProperty({ example: "f6c2a9c4-0e88-4b7c-8b9d-2e93c1c5c1b1" })
  @IsUUID()
  category_id!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

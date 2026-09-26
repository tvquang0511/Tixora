import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";
import { PaymentMethod } from "./payment-method.enum";

export class CreatePaymentDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  order_id!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PAYOS })
  @IsEnum(PaymentMethod)
  payment_method!: PaymentMethod;
}

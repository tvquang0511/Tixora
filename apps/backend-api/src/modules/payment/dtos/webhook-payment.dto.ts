import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "./payment-method.enum";
import { PaymentTicketBreakdownDto } from "./payment-ticket-breakdown.dto";

export enum WebhookPaymentStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export class WebhookPaymentDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  order_id!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PAYOS })
  @IsEnum(PaymentMethod)
  payment_method!: PaymentMethod;

  @ApiProperty({ example: "pay_3rd_party_12345" })
  @IsUUID("4", { message: "transaction_id_3rd_party must be a UUID v4" })
  transaction_id_3rd_party!: string;

  @ApiProperty({
    enum: WebhookPaymentStatus,
    example: WebhookPaymentStatus.SUCCESS,
  })
  @IsEnum(WebhookPaymentStatus)
  status!: WebhookPaymentStatus;

  @ApiPropertyOptional({ type: [PaymentTicketBreakdownDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentTicketBreakdownDto)
  ticket_breakdown?: PaymentTicketBreakdownDto[];
}

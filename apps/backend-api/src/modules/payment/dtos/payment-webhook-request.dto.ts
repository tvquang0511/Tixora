import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export interface WebhookData {
  orderCode?: number;
  amount?: number;
  transactionDateTime?: string;
  paymentLinkId?: string;
  ticket_breakdown?: any;
  [key: string]: unknown;
}

export class PaymentWebhookRequestDto {
  @ApiPropertyOptional({ example: "00" })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: "success" })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiProperty({
    description: "Webhook payload (free-form object)",
    type: Object,
    additionalProperties: true,
  })
  @IsDefined()
  @IsObject()
  data!: WebhookData;

  @ApiProperty({ description: "Webhook signature" })
  @IsString()
  @IsNotEmpty()
  signature!: string;
}

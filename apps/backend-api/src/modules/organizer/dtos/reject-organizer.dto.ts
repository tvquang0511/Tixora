import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RejectOrganizerDto {
  @ApiProperty({ example: "Giấy phép kinh doanh không khớp thông tin đăng ký" })
  @IsString()
  @IsNotEmpty()
  rejection_reason!: string;
}

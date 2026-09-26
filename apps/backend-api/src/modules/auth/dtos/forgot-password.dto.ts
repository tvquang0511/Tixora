import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Địa chỉ email cần khôi phục mật khẩu",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

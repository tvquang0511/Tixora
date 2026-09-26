import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIs...",
    description: "Mã xác thực khôi phục mật khẩu gửi qua email",
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: "newPassword123",
    description: "Mật khẩu mới muốn đổi",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Mật khẩu mới phải có tối thiểu 6 ký tự." })
  newPassword!: string;
}

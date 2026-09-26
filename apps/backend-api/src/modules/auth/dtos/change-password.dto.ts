import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "123456", description: "Mật khẩu hiện tại của bạn" })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @ApiProperty({
    example: "654321abc",
    description: "Mật khẩu mới muốn thay đổi",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Mật khẩu mới phải có tối thiểu 6 ký tự." })
  newPassword!: string;
}

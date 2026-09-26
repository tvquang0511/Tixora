import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@example.com", description: "Email address" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "123456", description: "Password" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

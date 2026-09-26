import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "Email address" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: "123456",
    description: "Password (min 6 characters)",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "Nguyen Van A", description: "Full name" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;
}

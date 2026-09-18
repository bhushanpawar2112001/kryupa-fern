import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FirebaseAuthDto {
  @ApiProperty({ description: 'Firebase ID token obtained from the client SDK' })
  @IsString()
  idToken: string;
}

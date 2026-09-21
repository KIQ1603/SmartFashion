import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export enum InteractionTypeDto {
  view = 'view',
  wishlist = 'wishlist',
  add_to_cart = 'add_to_cart',
  remove_from_cart = 'remove_from_cart',
  purchase = 'purchase',
  return = 'return',
}

export class CreateInteractionDto {
  @IsUUID()
  productId: string;

  @IsEnum(InteractionTypeDto)
  interactionType: InteractionTypeDto;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsInt()
  dwellTimeSeconds?: number;
}

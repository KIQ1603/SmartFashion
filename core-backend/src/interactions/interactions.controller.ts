import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser, JwtUserPayload } from '../auth/decorators/current-user.decorator';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Controller('interactions')
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  record(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateInteractionDto) {
    return this.interactionsService.record(user?.userId, dto);
  }
}

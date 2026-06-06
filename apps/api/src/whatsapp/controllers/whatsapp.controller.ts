import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private service: WhatsappService) {}

  @Get('webhook')
  @ApiOperation({ summary: 'Verificación de webhook de Meta' })
  verifyWebhook(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    return this.service.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recibir mensajes de WhatsApp' })
  handleWebhook(@Body() body: any) {
    return this.service.handleWebhook(body);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async handleWebhook(body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    if (!message) return { status: 'no_message' };

    const from = message.from;
    const text = message?.text?.body?.toLowerCase() ?? '';
    this.logger.log(`WhatsApp message from ${from}: ${text}`);

    if (text.includes('precio')) return this.handlePriceQuery(from, text);
    if (text.includes('vender') || text.includes('vendo')) return this.handleSellFlow(from, text);
    if (text.includes('crédito') || text.includes('prestamo')) return this.handleCreditQuery(from, text);
    return this.sendHelp(from);
  }

  private async handlePriceQuery(from: string, text: string) {
    // TODO: parse product and department from text, query DB
    return { status: 'price_query', from, response: '📊 Consultando precios...' };
  }

  private async handleSellFlow(from: string, text: string) {
    return { status: 'sell_flow', from, response: '🌾 Para publicar tu cosecha, ingresa al app: agromarket.bo' };
  }

  private async handleCreditQuery(from: string, text: string) {
    return { status: 'credit_query', from, response: '💰 Para solicitar crédito, ingresa al app y revisa tu score.' };
  }

  private async sendHelp(from: string) {
    return { status: 'help', from, response: '🌾 AgroMarket Bolivia\n• "precio [producto]" - consultar precios\n• "vender" - publicar cosecha\n• "crédito" - solicitar crédito\n• Visita: agromarket.bo' };
  }

  verifyWebhook(mode: string, token: string, challenge: string) {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'agromarket-verify');
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    return null;
  }
}

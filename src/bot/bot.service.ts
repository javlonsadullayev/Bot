import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

interface Product {
  name: string;
  price: number;
}

@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot;
  private users: { [key: number]: Partial<Product> } = {};

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new TelegramBot(token, { polling: true });

    this.bot.onText(/\/start/, (msg) => {
      this.users[msg.chat.id] = {};
      this.bot.sendMessage(
        msg.chat.id,
        `Salom! Men sizning product nomi va narxini qabul qiladigan botman.\n\n` +
          `Avvalo product nomini kiriting:`
      );
    });

    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      if (!this.users[chatId]) return;

      if (!this.users[chatId].name) {
        this.users[chatId].name = text;
        this.bot.sendMessage(chatId, 'Endi product narxini kiriting (raqam bilan):');
        return;
      }

      if (!this.users[chatId].price) {
        const price = Number(text);
        if (isNaN(price)) {
          this.bot.sendMessage(chatId, 'Iltimos, faqat raqam kiriting:');
          return;
        }
        this.users[chatId].price = price;

        this.bot.sendMessage(
          chatId,
          `Product qo'shildi!\n\n` +
            `Nom: ${this.users[chatId].name}\n` +
            `Narx: ${this.users[chatId].price}`
        );

        delete this.users[chatId];
      }
    });
  }
}

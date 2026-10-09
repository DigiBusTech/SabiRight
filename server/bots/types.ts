export type BotChannel = 'whatsapp' | 'telegram';

export interface BotQuickAction {
  id: string;
  title: string;
  payload: string;
  url?: string;
}

export interface IncomingBotMessage {
  channel: BotChannel;
  channelUserId: string;          // e.g. 'wa_2348012345678' or 'tg_987654321'
  rawSenderId: string;            // '2348012345678' or '987654321'
  userName?: string;
  phoneNumber?: string;
  text: string;
  actionPayload?: string;
  eventId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface BotResponse {
  text: string;
  quickActions?: BotQuickAction[];
  listMenu?: {
    title: string;
    buttonText: string;
    items: {
      id: string;
      title: string;
      description?: string;
    }[];
  };
}

import { logger } from '../../utils/logger';

export class WiseIntegration {
  private apiToken: string;
  private profileId: string;
  private baseUrl = 'https://api.transferwise.com/v1';

  constructor(apiToken: string, profileId: string) {
    this.apiToken = apiToken;
    this.profileId = profileId;
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`Wise API error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async createTransfer(params: {
    recipientEmail: string; amount: number; currency: string; reference: string;
  }) {
    // 1. Quote
    const quote = await this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        profile: this.profileId,
        sourceCurrency: params.currency,
        targetCurrency: params.currency,
        sourceAmount: params.amount / 100,
      }),
    });

    // 2. Recipient
    const recipient = await this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        profile: this.profileId,
        accountHolderName: params.recipientEmail,
        currency: params.currency,
        type: 'email',
        details: { email: params.recipientEmail },
      }),
    });

    // 3. Transfer
    const transfer = await this.request('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        targetAccount: recipient.id,
        quoteUuid: quote.id,
        customerTransactionId: `chronos-${Date.now()}`,
        details: { reference: params.reference },
      }),
    });

    logger.info(`Wise transfer created: ${transfer.id}`);
    return transfer.id;
  }
}

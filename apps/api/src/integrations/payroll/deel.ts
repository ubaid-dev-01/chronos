import { logger } from '../../utils/logger';

export class DeelIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.deel.com/rest/v2';

  constructor(apiKey: string) { this.apiKey = apiKey; }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`Deel API error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async listContractors() {
    const data = await this.request('/contracts');
    return data.data.map((c: any) => ({
      id: c.id, email: c.worker?.email, name: c.worker?.name,
    }));
  }

  async createPayment(params: {
    contractorId: string; amount: number; currency: string;
    description: string; periodStart: string; periodEnd: string;
  }) {
    const data = await this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        contract_id: params.contractorId,
        amount: params.amount / 100,
        currency: params.currency,
        description: params.description,
        date_from: params.periodStart,
        date_to: params.periodEnd,
      }),
    });
    logger.info(`Deel payment created: ${data.data.id}`);
    return data.data.id;
  }
}

import crypto from "crypto";

const BASE = "https://api.paystack.co";

class PaystackService {
  private secretKey: string;
  private publicKey: string;

  constructor(config: { secretKey: string; publicKey: string }) {
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;
  }

  private async call(path: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && json.status === undefined) json.status = false;
    return json;
  }

  // data.amount must be in kobo
  async initializePayment(data: { email: string; amount: number; reference: string; currency?: string; callback_url?: string; metadata?: any }): Promise<any> {
    return this.call("/transaction/initialize", { method: "POST", body: JSON.stringify(data) });
  }

  async verifyPayment(reference: string): Promise<any> {
    return this.call(`/transaction/verify/${encodeURIComponent(reference)}`);
  }

  // Signature is HMAC-SHA512 of the raw request body using the secret key.
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!signature || !this.secretKey) return false;
    const expected = crypto.createHmac("sha512", this.secretKey).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}

export default PaystackService;


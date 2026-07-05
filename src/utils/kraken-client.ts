import crypto from 'node:crypto'

type KrakenPrivatePayload = Record<string, string | number | boolean>

export class KrakenClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly apiSecret: string,
  ) {}

  async publicRequest<TResponse>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<TResponse> {
    const url = new URL(path, this.baseUrl)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Kraken HTTP ${response.status}`)
    }

    return response.json() as Promise<TResponse>
  }

  async privateRequest<TResponse>(
    path: string,
    payload: KrakenPrivatePayload = {},
  ): Promise<TResponse> {
    const nonce = Date.now().toString()

    const body = new URLSearchParams({
      nonce,
      ...Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, String(value)]),
      ),
    })

    const apiSign = this.sign(path, nonce, body.toString())

    const response = await fetch(new URL(path, this.baseUrl), {
      method: 'POST',
      headers: {
        'API-Key': this.apiKey,
        'API-Sign': apiSign,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      throw new Error(`Kraken HTTP ${response.status}`)
    }

    return response.json() as Promise<TResponse>
  }

  private sign(path: string, nonce: string, postData: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(nonce + postData)
      .digest()

    const message = Buffer.concat([
      Buffer.from(path),
      hash,
    ])

    return crypto
      .createHmac('sha512', Buffer.from(this.apiSecret, 'base64'))
      .update(message)
      .digest('base64')
  }
}
import config from "../config";

const PAYPAL_BASE_URL =
  config.paypal.mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Access token cache — module-level, reused across requests
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export const getPayPalAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${config.paypal.clientId}:${config.paypal.clientSecret}`,
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token fetch failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token as string;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
};

export const paypalRequest = async <T>(
  method: string,
  path: string,
  body?: object,
): Promise<T> => {
  const accessToken = await getPayPalAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal API error [${res.status}] ${path}: ${err}`);
  }

  return res.json() as Promise<T>;
};

// Webhook signature verification
export const verifyPayPalWebhookSignature = async (
  headers: Record<string, string>,
  rawBody: string,
  webhookId: string,
): Promise<boolean> => {
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const result = await paypalRequest<{ verification_status: string }>(
    "POST",
    "/v1/notifications/verify-webhook-signature",
    payload,
  );

  return result.verification_status === "SUCCESS";
};

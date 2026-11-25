import type { Order } from "@/types";

/**
 * Hosted checkout is customer-facing and calls the public API directly.
 * The session id is the capability; no API key is shipped to the browser.
 */
const PUBLIC_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/+$/, "");

async function parseError(res: Response): Promise<string> {
  let message = `API error: ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    }
  } catch {
    // Non-JSON error body.
  }
  return message;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface CheckoutCartItem {
  name: string;
  price: number;
  quantity?: number;
  mrp?: number;
  sku?: string;
}

export interface CheckoutSession {
  sessionId: string;
  expiresAt?: string;
  brand?: { name?: string; codFee?: number };
  cart?: {
    items?: CheckoutCartItem[];
    subtotal?: number;
    codFee?: number;
    amount?: number;
  };
}

export interface CheckoutAddress {
  id: string;
  house: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface CreateCheckoutOrderInput {
  sessionId?: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  pincode: string;
  house: string;
  address: string;
  landmark?: string;
}

export const api = {
  getCheckoutSession: (sessionId: string) =>
    request<CheckoutSession>(`/checkout/session/${encodeURIComponent(sessionId)}`),
  sendCheckoutOtp: (phone: string, sessionId: string) =>
    request<{
      sent: boolean;
      phone: string;
      expiresIn: number;
      devOtp?: string;
      message: string;
    }>("/checkout/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone, sessionId }),
    }),
  verifyCheckoutOtp: (phone: string, otp: string, sessionId: string) =>
    request<{
      verified: boolean;
      phone: string;
      customer?: { name: string; email?: string; tag: string } | null;
      addresses: CheckoutAddress[];
      hasPrefill: boolean;
      error?: string;
    }>("/checkout/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp, sessionId }),
    }),
  createCheckoutOrder: (orderData: CreateCheckoutOrderInput) =>
    request<{ order: Order; returnUrl?: string; isIdempotentReplay?: boolean }>(
      "/checkout/order",
      {
        method: "POST",
        body: JSON.stringify(orderData),
      },
    ),
};

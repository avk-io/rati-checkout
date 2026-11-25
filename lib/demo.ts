import type { CheckoutAddress, CheckoutSession } from "@/lib/api";
import type { Order } from "@/types";

export const DEMO_SESSION_ID = "demo";
export const DEMO_OTP = "123456";

/** `demo` is the canonical demo id; `test` is kept as an alias. */
export function isDemoSessionId(sessionId?: string): boolean {
  return sessionId === DEMO_SESSION_ID || sessionId === "test";
}

export function getDemoSession(): CheckoutSession {
  const items = [
    { name: "Neem Face Wash 100ml", price: 249, mrp: 299, quantity: 1, sku: "NFW-100" },
    { name: "Aloe Vera Gel 200ml", price: 199, mrp: 249, quantity: 1, sku: "AVG-200" },
    { name: "Vitamin C Serum 30ml", price: 599, mrp: 699, quantity: 1, sku: "VCS-30" },
  ];

  return {
    sessionId: DEMO_SESSION_ID,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    brand: { name: "Montecarlo", codFee: 0 },
    cart: {
      items,
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      codFee: 0,
      amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    },
  };
}

export const demoCustomer = {
  name: "Aarav Sharma",
  email: "aarav.sharma@example.com",
};

export const demoAddress: CheckoutAddress = {
  id: "addr_demo",
  house: "Flat 302, Green Valley Apartments, MG Road",
  landmark: "Near Metro Station",
  pincode: "411001",
  city: "Pune",
  state: "Maharashtra",
  isDefault: true,
};

export function createDemoOrder(input: {
  name: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  pincode: string;
  house: string;
  landmark?: string;
  amount: number;
  items: { name: string; sku?: string; quantity?: number; price: number }[];
}): Order {
  return {
    id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: input.name,
      phone: input.phone,
      email: input.email,
    },
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    address: {
      house: input.house,
      landmark: input.landmark,
      type: "residential",
    },
    items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku || "DEMO-SKU",
      quantity: item.quantity || 1,
      price: item.price,
    })),
    amount: input.amount,
    paymentMode: "cod",
    codAmount: input.amount,
    status: "New",
    courier: "Demo Courier",
    weight: 0.5,
    dimensions: { length: 20, breadth: 15, height: 10 },
    source: "demo",
  };
}

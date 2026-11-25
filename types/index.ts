export interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string; email?: string };
  city: string;
  state: string;
  pincode: string;
  address: { house: string; landmark?: string; type: "residential" | "commercial" };
  items: OrderItem[];
  amount: number;
  paymentMode: "prepaid" | "cod";
  codAmount?: number;
  status:
    | "New"
    | "Ready to Ship"
    | "Pickup Scheduled"
    | "In Transit"
    | "Out for Delivery"
    | "Delivered"
    | "NDR"
    | "RTO"
    | "Cancelled";
  courier: string;
  awb?: string;
  pickupDate?: string;
  expectedDelivery?: string;
  weight: number;
  dimensions: { length: number; breadth: number; height: number };
  shippedAt?: string;
  deliveredAt?: string;
  ndrReason?: string;
  ndrAttempts?: number;
  isDuplicate?: boolean;
  isOnHold?: boolean;
  incompleteAddress?: boolean;
  source: string;
}

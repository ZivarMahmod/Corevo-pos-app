import { supabase } from "./supabase";

export type PaymentMethod = "swish" | "manual" | "scanner" | "card";

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  tenant_id: string;
  receipt_number: string;
  items: OrderItem[];
  total: number;
  payment_method: PaymentMethod;
  status: "pending" | "completed" | "cancelled";
  created_at?: string;
}

export async function createOrder(
  order: Omit<Order, "id" | "created_at">
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw error;
}

export async function decrementStock(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    const { error } = await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (error) throw error;
  }
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${date}-${rand}`;
}

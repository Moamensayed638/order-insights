import type { AdminOrder } from "@/types/order";
import { apiUrl, getAuthHeaders } from "@/lib/auth";
import { adminOrderSchema, adminOrdersResponseSchema } from "@/lib/orderSchemas";

const ORDERS_PATH = "adminorders";

export async function fetchOrders(): Promise<AdminOrder[]> {
  const res = await fetch(apiUrl(ORDERS_PATH), { headers: { ...getAuthHeaders() } });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const payload = await res.json().catch(() => null);
  const parsed = adminOrdersResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid orders response shape");
  }

  return Array.isArray(parsed.data) ? parsed.data : parsed.data.data;
}

export async function updateOrderStatus(orderId: number, status: number): Promise<AdminOrder> {
  const res = await fetch(apiUrl(`AdminOrders/${orderId}/status?status=${status}`), {
    method: "PUT",
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const payload = await res.json().catch(() => null);
  const parsed = adminOrderSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid order update response shape");
  }

  return parsed.data;
}

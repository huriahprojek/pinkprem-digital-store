import { z } from 'zod';
import type { OrderStatus } from './format';
export const customerSchema = z.object({ full_name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100), whatsapp: z.string().trim().regex(/^[+\d\s()-]{9,24}$/, 'Nomor WhatsApp tidak valid').transform(s => s.replace(/\D/g, '')).refine(s => s.length >= 9 && s.length <= 16, 'Nomor WhatsApp tidak valid'), email: z.string().trim().email('Email tidak valid').max(255), note: z.string().trim().max(500).default('') });
export const productSchema = z.object({ name: z.string().trim().min(1).max(100), slug: z.string().regex(/^[a-z0-9-]+$/,'Slug hanya huruf kecil, angka, dan tanda hubung').max(100), category: z.string().trim().min(1).max(100), short_description: z.string().max(300), description: z.string().max(5000), image_path: z.string().max(300).nullable(), is_active: z.boolean(), sort_order: z.coerce.number().int() });
export const optionSchema = z.object({ product_id: z.string().uuid(), name: z.string().trim().min(1).max(100), description: z.string().max(1000), is_active: z.boolean(), sort_order: z.coerce.number().int() });
export const variantSchema = z.object({ id: z.string().uuid().optional(), product_id: z.string().uuid(), option_id: z.string().uuid().nullable(), name: z.string().trim().min(1).max(100), duration_days: z.number().int().positive().nullable(), price: z.coerce.number().min(0).max(9999999999), cost_price: z.coerce.number().min(0).max(9999999999), stock: z.coerce.number().int().min(0).max(2147483647), is_active: z.boolean(), sort_order: z.coerce.number().int() });
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = { menunggu_pembayaran: ['dibayar','dibatalkan'], dibayar: ['diproses','dibatalkan'], diproses: ['selesai','dibatalkan'], selesai: [], dibatalkan: [] };
export function canTransition(from: OrderStatus, to: OrderStatus) { return NEXT_STATUS[from].includes(to); }
export function dateRange(period: string, from?: string, to?: string, now = new Date()) {
 const end = new Date(now); const start = new Date(now);
 // Jakarta calendar boundaries, independent of browser time zone.
 const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year:'numeric',month:'2-digit',day:'2-digit' }).format(now);
 const today = new Date(`${day}T00:00:00+07:00`);
 start.setTime(today.getTime()); end.setTime(today.getTime()+86400000);
 if (period === 'minggu') start.setTime(start.getTime()-6*86400000);
 if (period === 'bulan') start.setTime(new Date(`${day.slice(0,7)}-01T00:00:00+07:00`).getTime());
 if (period === 'custom' && from && to) { start.setTime(new Date(`${from}T00:00:00+07:00`).getTime()); end.setTime(new Date(`${to}T00:00:00+07:00`).getTime()+86400000); }
 if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) throw new Error('Rentang tanggal tidak valid');
 return { from:start.toISOString(), to:end.toISOString() };
}

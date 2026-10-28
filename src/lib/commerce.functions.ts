import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { customerSchema } from './commerce-rules';
export const accountData = createServerFn({ method:'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const [p,o,b] = await Promise.all([context.supabase.from('profiles').select('*').eq('id',context.userId).single(),context.supabase.from('orders').select('*,order_items(*),order_status_history(*)').eq('user_id',context.userId).order('created_at',{ascending:false}),context.supabase.rpc('admin_exists')]);
 if(p.error) throw p.error; if(o.error) throw o.error; if(b.error) throw b.error;
 return { profile:p.data, orders:o.data, adminExists:b.data };
});
export const adminData = createServerFn({ method:'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const role = await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(role.error || !role.data) throw new Error('Akses khusus admin');
 const [p,o,c,u,r,s] = await Promise.all([context.supabase.from('products').select('*,product_options(*),product_variants(*)').order('sort_order'),context.supabase.from('orders').select('*,order_items(*,order_item_costs(*)),order_status_history(*)').order('created_at',{ascending:false}),context.supabase.from('variant_costs').select('*'),context.supabase.from('profiles').select('*').order('created_at',{ascending:false}),context.supabase.from('user_roles').select('*'),context.supabase.from('store_settings').select('*').eq('id',1).single()]);
 for(const result of [p,o,c,u,r,s]) if(result.error) throw result.error;
 return { products:p.data ?? [],orders:o.data ?? [],costs:c.data ?? [],users:u.data ?? [],roles:r.data ?? [],settings:s.data };
});
export const checkoutOrder = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator((input:unknown) => z.object({customer:customerSchema,items:z.array(z.object({variant_id:z.string().uuid(),quantity:z.number().int().min(1).max(100)})).min(1).max(50)}).parse(input)).handler(async ({context,data}) => {
 const {data:result,error} = await context.supabase.rpc('place_order',{_items:data.items,_customer_name:data.customer.full_name,_customer_whatsapp:data.customer.whatsapp,_customer_email:data.customer.email,_note:data.customer.note});
 if(error) throw new Error(error.message);
 const parsed = z.object({order_id:z.string().uuid()}).parse(result);
 const order = await context.supabase.from('orders').select('*,order_items(*),order_status_history(*)').eq('id',parsed.order_id).eq('user_id',context.userId).single();
 if(order.error) throw new Error('Pesanan sudah dibuat. Buka Akun untuk melihat ringkasannya.');
 return order.data;
});

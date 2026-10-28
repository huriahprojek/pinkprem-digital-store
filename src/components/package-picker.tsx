import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingBag,Plus,Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Choice } from './commerce-ui';
import { RestockButton } from './shop';
import { type Product } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import { useCart } from '@/lib/cart';
export function PackagePicker({product}:{product:Product}) {
 const cart=useCart(); const options=product.product_options.filter(o=>o.is_active);
 const [option,setOption]=useState(options[0]?.id ?? 'none'); const [variantId,setVariantId]=useState('');const [qty,setQty]=useState(1);
 const variants=product.product_variants.filter(v=>v.is_active && (v.option_id ?? 'none')===option);
 const selected=variants.find(v=>v.id===variantId) ?? variants[0];
 const optionItems=options.map(o=>({value:o.id,label:o.name})); if(product.product_variants.some(v=>!v.option_id)) optionItems.push({value:'none',label:'Paket lainnya'});
 const already=cart.lines.find(l=>l.variantId===selected?.id)?.quantity ?? 0; const remaining=Math.max(0,(selected?.stock ?? 0)-already);
 return <div className="space-y-5">{optionItems.length>0&&<Choice label="Pilihan akun" value={option} onChange={v=>{setOption(v);setVariantId('');setQty(1)}} items={optionItems}/>}{options.find(o=>o.id===option)?.description&&<p className="text-sm text-muted-foreground">{options.find(o=>o.id===option)?.description}</p>}<div className="space-y-2">{variants.map(v=><Button key={v.id} variant={selected?.id===v.id?'secondary':'outline'} className="h-auto w-full justify-between gap-3 whitespace-normal py-3 text-left" aria-pressed={selected?.id===v.id} onClick={()=>{setVariantId(v.id);setQty(1)}}><span className="min-w-0"><span className="block font-semibold">{v.name}</span><span className="text-xs text-muted-foreground">{v.duration_days ? `${v.duration_days} hari · `:''}{v.stock>0?`${v.stock} tersedia`:'Stok Habis'}</span></span><span className="shrink-0">{rupiah(v.price)}</span></Button>)}</div>{selected ? selected.stock===0 ? <RestockButton product={product.name} variant={`${options.find(o=>o.id===option)?.name ?? ''} ${selected.name}`}/> : <><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Kurangi jumlah" disabled={qty<=1} onClick={()=>setQty(q=>q-1)}><Minus/></Button><span className="w-8 text-center tabular-nums">{qty}</span><Button variant="outline" size="icon" aria-label="Tambah jumlah" disabled={qty>=Math.min(100,remaining)} onClick={()=>setQty(q=>q+1)}><Plus/></Button></div><p className="font-semibold">{rupiah(selected.price*qty)}</p></div><Button className="w-full" disabled={remaining===0} onClick={()=>{cart.add(selected.id,Math.min(qty,remaining),selected.stock);toast.success('Paket ditambahkan ke keranjang')}}><ShoppingBag/>{remaining===0?'Semua stok sudah di keranjang':'Tambah ke keranjang'}</Button><Button asChild variant="outline" className="w-full"><Link to="/keranjang">Lihat keranjang ({cart.count})</Link></Button></> : <p className="text-sm text-muted-foreground">Belum ada paket aktif.</p>}</div>
}

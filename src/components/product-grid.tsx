import { useState } from "react";
import { ArrowUpRight, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState, ProductTile, RestockButton } from "@/components/shop";
import { minPrice, totalStock, type Product } from "@/lib/catalog";
import { rupiah } from "@/lib/format";

export function ProductGrid({ products, searchable = false }: { products: Product[]; searchable?: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState<Product | null>(null);
  const categories = ["Semua", ...new Set(products.map(p => p.category))];
  const shown = products.filter(p => (category === "Semua" || p.category === category) && `${p.name} ${p.category} ${p.short_description}`.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
  return <>
    {searchable && <div className="mb-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="relative min-w-0 sm:max-w-md"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Cari aplikasi" placeholder="Cari aplikasi favoritmu…" value={search} onChange={e => setSearch(e.target.value)} className="h-10 bg-background pl-10" /></div>
        <p className="text-sm text-muted-foreground">{shown.length} produk</p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Kategori produk">{categories.map(c => <Button key={c} variant={c === category ? "secondary" : "outline"} size="sm" className="rounded-full" aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</Button>)}</div>
    </div>}
    {shown.length === 0 ? <EmptyState icon={<Package />} title="Produk tidak ditemukan" description="Coba nama aplikasi atau kategori lain." action={<Button variant="outline" onClick={() => { setSearch(""); setCategory("Semua"); }}>Lihat semua produk</Button>} /> :
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">{shown.map(p => {
      const price = minPrice(p);
      const available = totalStock(p) > 0;
      return <article key={p.id} className="group flex min-w-0 flex-col rounded-lg border bg-card p-3 transition-shadow hover:shadow-card sm:p-4">
        <div className="flex items-center justify-between gap-2"><ProductTile name={p.name} color={p.tile_color} imagePath={p.image_path} className="h-12 w-12 shrink-0 text-sm sm:h-14 sm:w-14" /><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${available ? "bg-status-done-bg text-status-done" : "bg-status-cancel-bg text-status-cancel"}`}>{available ? "Tersedia" : "Stok habis"}</span></div>
        <h3 className="mt-4 break-words font-sans text-sm font-bold sm:text-base">{p.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{p.category}</p>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{p.short_description || "Pilihan paket langganan premium."}</p>
        <div className="mt-auto pt-4"><p className="text-[11px] text-muted-foreground">Mulai dari</p><p className="mt-0.5 text-sm font-bold text-secondary-foreground sm:text-base">{price != null ? rupiah(price) : "Belum tersedia"}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full justify-between text-xs" onClick={() => setSelected(p)} aria-label={`Lihat paket ${p.name}`}>Lihat paket <ArrowUpRight className="size-3.5" /></Button></div>
      </article>;
    })}</div>}
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      {selected && <><DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>{selected.short_description || selected.category}</DialogDescription></DialogHeader>
        {selected.description && <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{selected.description}</p>}
        <div className="divide-y">{selected.product_variants.filter(v => v.is_active).map(v => <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-4"><div className="min-w-0"><p className="break-words text-sm font-semibold">{v.name}</p><p className="mt-1 text-xs text-muted-foreground">{v.duration_days ? `${v.duration_days} hari · ` : ""}{v.stock > 0 ? `${v.stock} tersedia` : "Stok habis"}</p></div><p className="text-sm font-semibold">{rupiah(v.price)}</p></div>)}</div>
        {totalStock(selected) === 0 && <RestockButton product={selected.name} variant="Semua paket" />}
      </>}
    </DialogContent></Dialog>
  </>;
}
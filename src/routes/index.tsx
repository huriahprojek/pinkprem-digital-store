import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorState, PageLoader, ProductTile } from "@/components/shop";
import { minPrice, productsQuery, totalStock } from "@/lib/catalog";
import { errorMessage, rupiah } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "fluffnshine — Langganan Aplikasi Premium Murah" },
      { name: "description", content: "Langganan Netflix, Canva, Spotify, ChatGPT dan lainnya dengan harga bersahabat." },
      { property: "og:title", content: "fluffnshine — Langganan Aplikasi Premium" },
      { property: "og:description", content: "Paket langganan aplikasi premium, pesan mudah via WhatsApp." },
    ],
  }),
  component: Index,
});

function Index() {
  const q = useQuery(productsQuery);
  return (
    <div>
      <section className="hero-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-3 inline-block rounded-full bg-blush px-3 py-1 text-xs font-semibold text-secondary-foreground">Aplikasi premium, harga bersahabat</p>
          <h1 className="max-w-2xl text-4xl font-semibold md:text-6xl">Langganan favoritmu, <span className="text-primary">lebih hemat</span>.</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">Pilih paket, checkout, lalu konfirmasi via WhatsApp. Akun dikirim setelah pembayaran dikonfirmasi admin.</p>
          <Button asChild size="lg" className="mt-8"><Link to="/produk">Lihat Katalog</Link></Button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Produk Populer</h2>
        {q.isLoading ? <PageLoader /> : q.error ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {q.data!.map((p) => {
              const price = minPrice(p);
              return (
                <div key={p.id} className="card-soft p-3">
                  <ProductTile name={p.name} color={p.tile_color} imagePath={p.image_path} className="w-full text-2xl" />
                  <p className="mt-3 font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{price != null ? `Mulai ${rupiah(price)}` : "-"}</p>
                  {totalStock(p) === 0 && <p className="text-xs font-semibold text-destructive">Stok Habis</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

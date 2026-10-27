import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorState, PageLoader } from "@/components/shop";
import { ProductGrid } from "@/components/product-grid";
import { productsQuery } from "@/lib/catalog";
import { errorMessage } from "@/lib/format";
import { ArrowRight, Sparkles, MessageCircle, Layers, Heart } from "lucide-react";
import cover from "@/assets/store-cover.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "fluffnshine — Langganan Aplikasi Premium Murah" },
      { name: "description", content: "Langganan Netflix, Canva, Spotify, ChatGPT dan lainnya dengan harga bersahabat." },
      { property: "og:title", content: "fluffnshine — Langganan Aplikasi Premium" },
      { property: "og:description", content: "Paket langganan aplikasi premium, pesan mudah via WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const q = useQuery(productsQuery);
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-blush">
        <img src={cover} alt="" width={1536} height={768} fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover object-left opacity-35 sm:object-center sm:opacity-100" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-secondary-foreground"><Sparkles className="size-4" /> Sedikit harga, banyak bahagia.</p>
          <h1 className="max-w-lg font-display text-4xl font-semibold leading-tight sm:text-5xl">fluffnshine<span className="text-primary">.</span></h1>
          <p className="mt-3 max-w-sm text-xl font-medium leading-snug sm:text-2xl">Langganan favoritmu,<br />lebih hemat setiap hari.</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground sm:max-w-sm">Dari hiburan sampai produktivitas, temukan paket premium yang pas untukmu.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/produk">Jelajahi katalog <ArrowRight /></Link></Button>
        </div>
      </section>
      <div className="border-b bg-background"><div className="mx-auto grid max-w-6xl grid-cols-3 gap-3 px-4 py-4 sm:px-6 sm:py-5">{[{icon: Layers, text: "Pilihan paket fleksibel"}, {icon: MessageCircle, text: "Konfirmasi via WhatsApp"}, {icon: Heart, text: "Harga bersahabat"}].map(({icon: Icon, text}) => <div key={text} className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left"><Icon className="size-4 shrink-0 text-secondary-foreground" /><span className="text-[11px] font-medium sm:text-xs">{text}</span></div>)}</div></div>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="mb-1 text-[11px] font-semibold uppercase text-secondary-foreground">Pilihan untukmu</p><h2 className="text-2xl font-semibold">Aplikasi favorit</h2></div><Button asChild variant="link" size="sm" className="px-0 text-xs text-secondary-foreground"><Link to="/produk">Lihat semua <ArrowRight /></Link></Button></div>
        {q.isLoading ? <PageLoader /> : q.error ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : (
          <ProductGrid products={q.data ?? []} />
        )}
      </section>
    </div>
  );
}

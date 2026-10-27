import { createFileRoute } from "@tanstack/react-router";
import { ErrorState, PageLoader } from "@/components/shop";
import { ProductGrid } from "@/components/product-grid";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/produk")({
  head: () => ({ meta: [{ title: "Katalog — fluffnshine" }, { name: "description", content: "Temukan pilihan paket aplikasi premium dan harga langganan di fluffnshine." }, { property: "og:title", content: "Katalog — fluffnshine" }, { property: "og:description", content: "Jelajahi aplikasi, harga paket, dan ketersediaan langganan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Catalog,
});

function Catalog() {
  const q = useQuery(productsQuery);
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"><div className="mb-6 border-b pb-6"><p className="mb-2 text-xs font-semibold text-secondary-foreground">Langganan pilihanmu</p><h1 className="text-3xl font-semibold">Katalog aplikasi</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Hiburan, kreativitas, dan produktivitas. Semua di satu tempat.</p></div>{q.isLoading ? <PageLoader /> : q.error ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : <ProductGrid products={q.data ?? []} searchable />}</div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/kontak")({
  head: () => ({ meta: [{ title: "Kontak — fluffnshine" }, { name: "description", content: "Kontak & Ketersediaan fluffnshine" }, { property: "og:title", content: "Kontak — fluffnshine" }, { property: "og:description", content: "Kontak & Ketersediaan fluffnshine" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <EmptyState title="Kontak & Ketersediaan" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});

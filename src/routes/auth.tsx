import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk — fluffnshine" }, { name: "description", content: "Masuk / Daftar fluffnshine" }, { property: "og:title", content: "Masuk — fluffnshine" }, { property: "og:description", content: "Masuk / Daftar fluffnshine" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <EmptyState title="Masuk / Daftar" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});

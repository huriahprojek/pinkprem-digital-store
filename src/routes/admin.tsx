import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — fluffnshine" }, { name: "description", content: "Dasbor Admin fluffnshine" }, { property: "og:title", content: "Admin — fluffnshine" }, { property: "og:description", content: "Dasbor Admin fluffnshine" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <EmptyState title="Dasbor Admin" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});

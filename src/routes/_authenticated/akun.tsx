import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/_authenticated/akun")({
  head: () => ({ meta: [{ title: "Akun — fluffnshine" }, { name: "description", content: "Akun Saya fluffnshine" }, { property: "og:title", content: "Akun — fluffnshine" }, { property: "og:description", content: "Akun Saya fluffnshine" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <EmptyState title="Akun Saya" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});

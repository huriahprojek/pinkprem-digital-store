import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, LayoutDashboard, LogOut, MessageCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/catalog";
import { waLink } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/produk", label: "Katalog" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground shadow-soft">
        P
      </span>
      <span className="font-display text-xl font-semibold">
        Pink<span className="text-primary">Prem</span>
      </span>
    </Link>
  );
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-blush text-secondary-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Keranjang">
            <Link to="/keranjang" className="relative">
              <ShoppingBag />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <div className="hidden items-center gap-1 md:flex">
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin"><LayoutDashboard /> Admin</Link>
              </Button>
            )}
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/akun"><User /> Akun</Link>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Keluar" onClick={signOut}><LogOut /></Button>
              </>
            ) : (
              <Button asChild size="sm"><Link to="/auth">Masuk</Link></Button>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-1" onClick={() => setOpen(false)}>
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} className="rounded-xl px-4 py-3 font-medium hover:bg-blush">{n.label}</Link>
                ))}
                <Link to="/keranjang" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Keranjang ({count})</Link>
                {user ? (
                  <>
                    <Link to="/akun" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Akun & Pesanan</Link>
                    {isAdmin && <Link to="/admin" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Dashboard Admin</Link>}
                    <button onClick={signOut} className="rounded-xl px-4 py-3 text-left font-medium hover:bg-blush">Keluar</button>
                  </>
                ) : (
                  <Button asChild className="mt-2"><Link to="/auth">Masuk / Daftar</Link></Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { data: s } = useSettings();
  return (
    <footer className="mt-20 border-t bg-blush/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">Langganan aplikasi premium dengan harga bersahabat, dikirim cepat via WhatsApp.</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Menu</p>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <Link to="/produk">Katalog</Link>
            <Link to="/keranjang">Keranjang</Link>
            <Link to="/akun">Pesanan Saya</Link>
            <Link to="/kontak">Kontak</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">Butuh bantuan?</p>
          {s && (
            <Button asChild variant="whatsapp" size="sm">
              <a href={waLink(s.admin_whatsapp, `Halo Admin ${s.store_name}, saya ingin bertanya.`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Chat WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} PinkPrem. Semua merek milik pemiliknya masing-masing.</p>
    </footer>
  );
}

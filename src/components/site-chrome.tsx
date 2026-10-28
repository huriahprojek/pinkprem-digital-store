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
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground shadow-soft">
        f
      </span>
      <span className="truncate font-display text-xl font-semibold lowercase">
        fluff<span className="text-primary">nshine</span>
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
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6 md:flex md:justify-between md:gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-blush text-secondary-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
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
                <Link to="/admin"><LayoutDashboard /> <span className="hidden sm:inline">Admin</span></Link>
              </Button>
            )}
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/akun" aria-label="Akun"><User /> <span className="hidden sm:inline">Akun</span></Link>
                </Button>
                <Button className="hidden md:inline-flex" variant="ghost" size="icon" aria-label="Keluar" onClick={signOut}><LogOut /></Button>
              </>
            ) : (
              <Button asChild size="sm"><Link to="/auth"><User className="hidden sm:block" /> Masuk</Link></Button>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 max-w-[90vw] px-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-1" onClick={() => setOpen(false)}>
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} className="rounded-xl px-4 py-3 font-medium hover:bg-blush">{n.label}</Link>
                ))}
                <Link to="/keranjang" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Keranjang ({count})</Link>
                {user ? (
                  <>
                    <Link to="/akun" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Akun & Pesanan</Link>
                    {isAdmin && <Link to="/admin" className="rounded-xl px-4 py-3 font-medium hover:bg-blush">Dasbor Admin</Link>}
                    <Button onClick={signOut} variant="ghost" className="justify-start">Keluar</Button>
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
    <footer className="mt-8 border-t bg-blush/50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
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
          {s?.whatsapp_configured && (
            <Button asChild variant="whatsapp" size="sm">
              <a href={waLink(s.admin_whatsapp, `Halo Admin ${s.store_name}, saya ingin bertanya.`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Hubungi WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} fluffnshine. Semua merek milik pemiliknya masing-masing.</p>
    </footer>
  );
}

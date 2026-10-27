# PinkPrem Digital Store

Build a polished, responsive full-stack Indonesian digital subscription ecommerce store called PinkPrem with a soft pastel pink + white visual design. It sells customer-facing digital app subscription packages. Use React + TypeScript + Tailwind/shadcn and Lovable's cloud backend/database/auth as available. Make it production-minded, not a static mockup.

Brand/design:
- Soft pink (#F47B9B), blush (#FFE7EE), white backgrounds, charcoal typography, very light pink borders, rounded cards, gentle shadows. Feminine, polished, modern and easy to use on mobile.
- Bahasa Indonesia throughout.
- Customer site pages: Home/landing, product catalog with search/category filters, product detail/package selection, cart, checkout, customer login/register, profile, order history/detail, contact/restock WhatsApp.
- Seed example catalog: Netflix, Canva Premium, HBO Max, CapCut Pro, Spotify, Prime Video, Vidio, ChatGPT, Claude AI, YouTube. Use generic letter tiles or appropriate simple icon treatment; do not use trademark logos copied from elsewhere.
- Products must be dynamic from database so admins can add additional apps later without code changes.
- Each product can have multiple product options (e.g. private/sharing, invite/email, slot 1P/2P/4P) and multiple variants/packages with any duration admins create (e.g. 1 hari, 7 hari, 1 bulan, 3 bulan, 1 tahun, custom). Each variant has sale price, cost/modal price, available stock, active flag. Prices can be updated by admin. Include stock quantity and slot/account availability. If variant stock hits zero, keep the variant visible and show “Stok Habis” + a “Hubungi admin untuk restock” WhatsApp CTA.
- Product option and variants should be data-driven; do not hardcode limited duration options in the database model.
- Cart: add product variant, adjust quantity within stock, remove; accurately calculate subtotal/total.
- Customer must register/login before placing order, using secure auth (do not store plaintext passwords or implement homemade password storage). Customer profile includes name, email, WhatsApp. Account page displays order history.
- Checkout asks name, WhatsApp, email, optional note. Create order in database with a unique readable order code, immutable snapshots of product name/variant/options and price at time of order, item quantities, total, current status “Menunggu Pembayaran”. Then open wa.me link to admin phone with a URL-encoded Indonesian template including order code, customer details, itemized products/options/duration/quantity, prices, total and note.
- Manual payment workflow for now: statuses “Menunggu Pembayaran”, “Dibayar”, “Diproses”, “Selesai”, “Dibatalkan”. Admin updates statuses. No payment gateway yet; architecture should make later integration possible.
- Stock: use safe database transaction/atomic validation so quantity cannot oversell. Keep a clear stock policy: reserve/decrement stock when an order is placed, and restore reserved stock if order cancelled before fulfillment; status transition handling must avoid duplicate adjustment. Make the behavior explicit in UI/admin.
- Admin dashboard protected by role-based access control enforced server/database-side; never trust client-side role state alone. Roles customer/admin. Admin can CRUD products, options, package variants, sale price, cost price, stock, active/visible state, upload/change images if storage available, manage orders/statuses, manage users, configure WhatsApp number and message template, and see reports filtered by today/week/month/custom date: gross sales, orders, units sold, profit based on saved cost-price snapshots, top selling products. Only admin sees cost prices/profit.
- Order item must snapshot modal/cost at the time of order to calculate historic profit correctly when costs change. Ensure reports exclude cancelled orders as appropriate and document calculations.
- Create normalized database schema and migrations for profiles/users, products, product_options, product_variants, orders, order_items, order_status_history, inventory adjustments if appropriate, and store settings. Include constraints, indexes, created_at, appropriate foreign keys and RLS policies. A customer can only read/update their own profile (safe fields only) and read their own orders; public can view active products/variants only; only admins can manage catalog, stock, all orders, settings, customers/reporting. Ensure safe privileged operations use backend functions/edge functions/database transactions as appropriate.
- Add attractive, useful empty/loading/error states, toasts, form validation, mobile menu, WhatsApp CTA buttons, and order status badges.
- Admin pages/layout separate from customer pages. Make order table sortable/filterable/searchable and product/variant forms usable.
- Add a clearly marked demo seed data with plausible sample prices/stocks, but never represent fake sales as real; new dashboard totals should show zero until actual orders.
- Provide a way for admin to set their WhatsApp phone number in settings; initialize to a safe placeholder and clearly indicate it must be configured before launch.
- Build the full core functionality end to end. Do not just make the UI or leave core controls dead. Check auth, database, RLS, order/stock logic and mobile responsiveness. If something requires a manual user action (e.g. linking/provisioning backend, admin promotion, or deployment), clearly explain it and do not claim it has happened until it has.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f2ac8f1-92e1-46d8-9b0e-4fee608eec44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

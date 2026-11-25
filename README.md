first deploy
# Rati Checkout

Standalone hosted **Cash-on-Delivery checkout** page for Rati Logistics.

This app is the customer-facing surface that a storefront redirects to after
creating a checkout session. It handles phone OTP verification, delivery
address capture, COD order placement, and the merchant return redirect.

## Demo

The demo is self-contained and does not need an API:

```bash
npm install
npm run dev
```

Open <http://localhost:3100/checkout/demo>.

- Use any 10-digit phone number.
- The OTP is **123456** (also shown in the page with an Auto Fill button).
- Placing the order shows a confirmation screen but does **not** create a real
  order.

`/` and `/checkout` redirect to the demo.

## Real checkout sessions

Point the app at a running Rati API:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3002
npm run dev
```

The merchant creates a session through `POST /checkout/sessions` and redirects
the shopper to:

```text
http://localhost:3100/checkout/<sessionId>
```

`NEXT_PUBLIC_API_URL` is inlined at build time, so set it before `npm run build`
in production.

## Deploy

The app deploys to Vercel or any Node host. Set `NEXT_PUBLIC_API_URL` to the
public Rati API URL in the hosting provider. The demo at `/checkout/demo` works
even when the variable is unset.

For Docker, `next.config.ts` uses `output: "standalone"`.

## Structure

```text
app/
  checkout/[sessionId]/page.tsx   hosted checkout UI (demo + real sessions)
  checkout/page.tsx               redirects to the demo
  page.tsx                        redirects to the demo
lib/
  api.ts                          public checkout API client
  demo.ts                         sample session, demo OTP and order
components/ui/                    minimal button and input primitives
```

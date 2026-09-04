# BolgeRadio

Live radio-PWA (Bølge) til iPhone og Android.

GitHub-navne kan kun bruge A–Z, 0–9 og bindestreg — derfor hedder repoet **BolgeRadio**, ikke «Bølge». Appens header kan stadig hedde Bølge.

## Funktioner

- Danske og udenlandske stationer
- Fast player med play/pause og «Nu spilles»
- Del Radio med QR-kode
- Admin (adgangskode) til farver, stationer og logo-upload

## Admin

Åbn `/admin`. Standard-adgangskode: `bolge-admin`

## Lokal kørsel

```bash
npm install
npm run dev
```

Sæt `DATABASE_URL` (Postgres/Neon) i produktion, så farver, stationer og logoer gemmes.

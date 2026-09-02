# Bølge — kør radioen på din egen server

Dansk internetradio. Stationer og ikoner ligger **på telefonen**. Lyden går **direkte** fra radiostationen til telefonen. Din server viser kun appen og henter sangtitler.

## Hvad der kører hvor

| | Hvor | Belaster din server? |
|---|---|---|
| Dine stationer, navne, ikoner | Telefonen (`localStorage` i browseren) | Nej |
| Selve radio-lyden | Telefonen henter streamen hos DR, Nova, osv. | **Nej** — bruger telefonens data/wifi |
| Sangtitel i playbaren | Din server spørger stationen ca. hvert 15. sekund | Ja, men meget lidt (typisk 20–80 KB pr. gang) |
| Appens HTML/CSS/JS | Din server | Ja, men en lille hjemmeside |

Hver telefon har **sin egen** stationsliste. Flytter du til en ny telefon, starter listen forfra (med forudfyldte stationer), medmindre du selv taster dem ind igen.

## Hvad serveren skal kunne

- **Node.js 22** (ikke PHP, ikke “bare HTML”)
- **HTTPS** — ellers virker “Føj til hjemmeskærm” og baggrundsafspilning dårligt på iPhone/Android
- Åbne udgående HTTPS-kald (så sangtitler kan hentes)
- Meget lidt RAM/CPU: **1 GB RAM** er mere end nok

Almindeligt dansk webhotel med kun FTP/PHP **kan ikke** køre appen.

## Bedste løsning

**1. Vercel (anbefalet)**  
Samme slags hosting som Grok bruger. Gratis til privat brug, HTTPS og verdensomspændende CDN med det samme. Du uploader koden og får en adresse. Det er den nemmeste og mest stabile vej.

**2. En lille VPS** (Hetzner, DigitalOcean, Contabo, egen Linux-maskine)  
Vælg det, hvis du vil eje maskinen. En billig cloud-VPS til 3–5 €/md. er rigeligt. Sæt Nginx eller Caddy foran med Let’s Encrypt.

**3. Server derhjemme**  
Kan lade sig gøre (Raspberry Pi, NAS, gammel PC), men du skal selv sørge for **offentlig IP, port 443 og HTTPS**. Sværere, og telefonen skal kunne nå den udefra.

Ikke: shared hosting, Pure FTP, Apache der kun serverer `.html`.

## Sådan bygger du

```bash
# 1. Pak zip'en ud
cd bolge-radio
npm install

# 2a. Vercel (nemmest)
npx vercel

# 2b. Egen VPS / Node-server
NITRO_PRESET=node-server npm run build
PORT=3000 node .output/server/index.mjs
```

På en VPS: lad Caddy/Nginx terminere HTTPS på port 443 og sende trafikken videre til Node på port 3000.

Appen har **ingen database** og **ingen login**. Du skal ikke sætte `DATABASE_URL`.

## Telefonen

Når siden kører på HTTPS: åbn den i Safari/Chrome → del → **Føj til hjemmeskærm**. Så opfører den sig som en app.

Stationer gemmes i **den browser / det ikon**, du bruger. Listen fra Grok-preview’et følger **ikke** automatisk med over på dit eget domæne.

## Drift

- Lyttere belaster **ikke** din upload med musik. Det gør radiostationerne.
- Din server mærker mest: sidevisninger + små titel-opslag, mens nogen lytter.
- Hvis en station blokerer titel-opslag, spiller lyden stadig; så vises bare stationsnavnet.

# Care Coins

A sample points-based rewards dashboard for demos. Everything is fictional sample data.

**Live demo:** https://simplefractal.github.io/care-coins/

- **Member page** (`index.html`): balance, ways to earn, a reward catalog with redeem, and recent activity.
- **Admin page** (`admin.html`): pick a team member, choose a reason, award points, and mark redemptions as fulfilled.

Both pages share one state, so an award on the admin page shows up on the member page, and a redemption shows up on the admin page as pending. Use "Reset demo data" at the bottom of either page to start over.

## How it works

Plain HTML, CSS and JavaScript. No backend, no build step, no dependencies.

- `state.js` holds all the logic (balances, awarding, redeeming, saving). It is pure functions, covered by `state.test.js`.
- State is saved in the browser's `localStorage`, so each visitor has their own copy and nothing is sent anywhere.
- Fonts load from Google Fonts.

## Customize

Change the brand name, the currency name and the accent color in `config.js`.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the files directly from disk also works in most browsers, but a local server is more reliable.

## Test

```bash
node --test state.test.js
```

Needs Node 20 or newer.

## Deploy

The site is served by GitHub Pages from the `main` branch, root folder. Push to `main` and it republishes in about a minute.

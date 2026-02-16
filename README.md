# Polymarket Analytics Dashboard

Freemium dashboard for Polymarket prediction markets.

## Features
- Live market data from Polymarket
- Search and filter by category
- Premium features: real-time updates, advanced charts, Telegram alerts
- Responsive design (Bootstrap 5 + Chart.js)

## Deployment
This is a static site for GitHub Pages.

1. Update `app.js` with your API URL
2. Enable GitHub Pages in repo settings
3. Set source to `main` branch (or `gh-pages`)

## API Backend
Requires FastAPI server with endpoints:
- `GET /markets` - List markets
- `GET /market/{id}` - Single market details

See `~/clawd/revenue-api/polymarket.py` for implementation.

# Vimagine

Kawaii task planner game prototype with story cards and character profile.

## Scripts

- dev: start local dev server
- build: production build
- preview: preview build
- lint: run ESLint
- format: run Prettier

## Groq API

1) Create a local .env file
2) Add: GROQ_API_KEY=YOUR_KEY
3) Restart the dev server

## Deployment

### GitHub Pages (UI)

- Push to main and GitHub Actions will publish to Pages
- The app expects the base URL /Vimagine-Game/

### Vercel (API)

- Deploy this repo to Vercel as a separate project
- Set environment variable GROQ_API_KEY in Vercel
- After deploy, set VITE_API_BASE in your local .env to the Vercel API URL
	Example: VITE_API_BASE=https://your-app.vercel.app/api/groq

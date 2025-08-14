This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local with Docker Compose

1. Create a `.env` file from the example:
   cp .env.example .env
   # Edit values as needed (API keys, thresholds)

2. Start both services:
   docker compose up --build

The web app will be on http://localhost:8080 and will call Flask at http://api:5328 via the internal network.

## Railway (two separate services)

- Build and deploy `Dockerfile.web` and `Dockerfile.api` as two services.
- Set environment variables from the Railway dashboard on each service.
- For the web service, set `NEXT_PUBLIC_FLASK_BASE_URL` to the API’s private URL, e.g. `http://<api-service>.railway.internal:5328`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

### Docker (split services)

Build and run API:

```bash
docker build -f Dockerfile.api -t hair-api:latest .
docker run -d --name hair-api -p 5328:5328 hair-api:latest
```

Build and run Web (pointing to API):

```bash
docker build -f Dockerfile.web -t hair-web:latest .
docker run -d --name hair-web -p 8080:8080 -e NEXT_PUBLIC_FLASK_BASE_URL=http://127.0.0.1:5328 hair-web:latest
```

On Railway, set `NEXT_PUBLIC_FLASK_BASE_URL` to your API's private URL, e.g. `http://hair-imaging-ai-segwitz.railway.internal:5328`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

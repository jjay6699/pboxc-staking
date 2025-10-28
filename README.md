This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Persistent Storage

The staking backend now stores wallet positions and transactions in [Vercel Postgres](https://vercel.com/storage/postgres) when the `POSTGRES_URL` environment variable is present. This guarantees that earnings continue to accrue and are visible after deploys or function restarts.

To enable it:

1. In the Vercel dashboard open **Storage → Postgres** and create a database (or run `vercel postgres create`).
2. Link the database to this project, then copy the generated `POSTGRES_URL` (and optional pooling URLs).
3. Add the variable(s) to your project (Vercel dashboard → Settings → Environment Variables).
4. Redeploy – the API layer will automatically create the required tables on first run.

Locally you can keep using the JSON fallback, or set `ENABLE_FILE_DB=true` to persist to `data/storage.json`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

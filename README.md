This is a Next.js invoice generation project.

## MongoDB Notes Setup

To store merchant notes from the bottom-right notes panel, configure:

```bash
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=lp-invoice
```

The notes widget stores merchant notes in MongoDB and does not change invoice numbering or the table.

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

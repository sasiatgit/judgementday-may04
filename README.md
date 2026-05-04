# Tamil Nadu Election Results Dashboard

Next.js SSR dashboard for Tamil Nadu assembly counting with:

- 38 districts at the top
- Select all / Clear all filters
- 234 constituency result listing
- ADMK, DMK, TVK, NTK, Others columns
- Candidate names by party per constituency
- 16 rounds of counting with round-wise votes
- PostgreSQL storage
- Pagination of 50 constituencies per page

## Setup

1. Create PostgreSQL database and set `DATABASE_URL` in `.env`.
2. Run the schema from `db/schema.sql` or seed directly with:

```bash
npm install
npm run db:seed
```

3. Start the app:

```bash
npm run dev
```

## Notes

- The included seed script generates 234 sample constituencies and full 16-round vote data.
- Replace the generated constituency names and candidate names with real election data as needed.

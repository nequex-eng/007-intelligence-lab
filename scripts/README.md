# Knowledge sync

The runtime data module is generated locally from the verified knowledge repository and is intentionally not committed.

- `npm run sync:knowledge`: fetches the pinned knowledge branch (override with `KNOWLEDGE_REF`) and validates required datasets.
- `npm run dev`: syncs first, then starts Wrangler Pages local development.
- `npm run deploy`: syncs first, then runs the explicitly authorized deploy script.

The source of truth is https://github.com/nequex-eng/007-intelligence-lab-knowledge. Do not manually edit generated runtime data.

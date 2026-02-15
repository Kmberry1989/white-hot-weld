# White Hot Weld

Production-ready Astro site for White Hot Weld, built static-first for Netlify/Vercel.

## Stack

- Astro (TypeScript strict mode)
- CSS Modules + global design tokens
- Markdown content collections
- Manifest-driven curated image library
- OGL shader background + Motion One interactions + Lenis smooth scroll

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run check
npm run build
```

## Media curation workflow

```bash
npm run media:audit
npm run media:sort
```

- Source ingest folder: `public/images/unsorted`
- Curated output folders:
  - `public/images/library/primary`
  - `public/images/library/editorial`
  - `public/images/library/thumb`
  - `public/images/library/archive/duplicates`
  - `public/images/library/archive/lowres`
- Generated manifest: `src/content/media/manifest.json`

## Content authoring

- Page copy: `src/content/pages/*.md`
- Work entries: `src/content/work/*.md`
- Work image assets: `src/assets/work/*`

Required `work` frontmatter fields:

- `title`
- `slug`
- `year`
- `materials`
- `dimensions`
- `excerpt`
- `featured`
- `coverImage`
- `galleryImages` (optional)
- `status` (optional: `available`, `sold`, `commissioned`)

## Routes

- `/`
- `/about`
- `/gallery`
- `/work/[slug]`
- `/contact`

## Deployment

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Config file: `netlify.toml`
- Contact form uses native Netlify Forms (`name="commission"`, `data-netlify="true"`).

### Vercel

- Astro static output from `dist`.
- No serverless dependency required in this phase.

## Notes

- Visual effects progressively enhance and gracefully fall back to static styling.
- Reduced-motion and coarse-pointer devices disable heavy motion/shader runtime.

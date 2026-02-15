# White Hot Weld

Phase 1 production-ready Astro site for White Hot Weld.

## Stack

- Astro (TypeScript strict mode)
- Static-first build output
- CSS Modules + global tokens
- Markdown content collections
- Netlify-first form handling (Vercel-compatible static output)

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

## Content authoring

- Page copy lives in `src/content/pages/*.md`
- Work entries live in `src/content/work/*.md`
- Work image assets live in `src/assets/work/*`

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
- `netlify.toml` is included.
- Contact form uses native Netlify Forms (`name="commission"`, `data-netlify="true"`).

### Vercel

- Static output is generated in `dist` via Astro.
- Standard Astro static deploy works without serverless requirements in this phase.

## Notes

- Placeholder assets are intentionally lightweight and should be replaced with production photography.
- Motion remains restrained and respects reduced-motion preferences.

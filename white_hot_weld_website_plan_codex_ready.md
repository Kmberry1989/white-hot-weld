# White Hot Weld — Website Build Plan

**Married Metal Art — Began with a Spark**

This document is a complete, Codex‑ready plan for designing and building the White Hot Weld website. It is structured to support incremental development, clean architecture, and long‑term growth using GitHub with Netlify or Vercel.

---

## 1. Brand Essence

**Core idea:** Commitment, craft, heat, and permanence.

- Two artists, one marriage, one forge
- Industrial materials treated with care and intention
- The work should feel dangerous, warm, and deliberate

**Visual tone:** Hot but precise. No chaos, no gimmicks.

---

## 2. Visual Direction

### Color Palette
- Charcoal / gunmetal base
- Warm white highlights
- Ember orange accents
- Occasional electric blue contrast

### Texture
- Subtle steel grain
- Brushed metal gradients
- Restrained glow effects

### Typography
- Headers: industrial serif or condensed grotesk
- Body: clean modern sans
- Avoid novelty or decorative fonts

### Motion
- Slow, restrained, heat‑inspired
- Subtle scroll reveals
- Soft glow on hover
- If motion is noticeable, it is too loud

---

## 3. Site Goals

- Showcase metal art as gallery‑level work
- Tell the story of Sheryl & John as partners
- Support commission inquiries
- Remain scalable without redesign

---

## 4. Site Structure

### Core Pages (Phase 1)
- Home
- About
- Gallery
- Contact

### Optional Expansion Pages
- Process
- Origin / Timeline
- Commissions
- Journal / Studio Notes

---

## 5. Homepage Architecture (Modular Sections)

Each section should be its own reusable component.

- **Ignition** — Cinematic hero (image or video)
- **What This Is** — Short philosophical introduction
- **The Proof** — Featured works (3–6 pieces)
- **The People** — Sheryl & John
- **The Invitation** — Contact or commission CTA

Sections must be reorderable without breaking layout.

---

## 6. About Page Structure

- Studio or forge image (authentic, not posed)
- Short origin story
- Timeline beats (meeting, first weld, first sale)
- Shared philosophy
- Individual strengths without stereotypes

Avoid résumé language unless meaningful.

---

## 7. Gallery Strategy

**Curation rules:**
- Fewer pieces than expected
- Large imagery
- Confident use of space

### Routes
- `/gallery` — overview
- `/work/[slug]` — individual work pages

Each work page should support:
- Large images
- Short contextual description
- Optional process or story expansion later

---

## 8. Commissions (Phase 3)

### Form Capabilities
- Size selection
- Material selection
- Indoor / outdoor use
- Budget range
- Timeline expectations
- Reference image uploads

### Technical Notes
- Netlify Forms or Vercel serverless functions
- Automated but human‑sounding response

---

## 9. Future Shop Options (Phase 4)

### Option A — Limited Drops
- Small releases
- High drama
- Scarcity‑driven

### Option B — Permanent Collection
- Wall art
- Sculptural objects
- Outdoor installations

**Backends:** Shopify, Snipcart, or custom

---

## 10. Tech Stack

- GitHub for version control
- Framework: Next.js or Astro
- Styling: Tailwind CSS or structured CSS modules
- Deployment: Vercel (Next.js) or Netlify (static + forms)
- Preview deploys enabled for all pull requests

---

## 11. Repository Structure (Recommended)

```
/components
  Hero.tsx
  Section.tsx
  GalleryGrid.tsx
  WorkCard.tsx

/content
  pages/
  work/
  journal/

/public
  images/
  video/

/styles
```

---

## 12. Performance & Quality

- Optimized responsive images
- High Lighthouse scores
- Accessible headings and alt text
- Mobile‑first layouts

---

## 13. Deployment Workflow

- Every major change uses a preview deploy
- Visual approval replaces abstract feedback
- Changes merged only after review

---

## 14. Iterative Milestones

- [ ] Wireframe core pages
- [ ] Collect initial imagery
- [ ] Draft homepage copy
- [ ] Scaffold repository
- [ ] Build Phase 1 pages
- [ ] Deploy previews
- [ ] Iterate with feedback

---

## 15. Optional Signature Ideas

- Heat‑map overlays showing weld intensity
- Subtle spark cursor on hover
- Studio journal
- AR preview of pieces on a wall

---

## 16. Guiding Principle

This site should feel like standing near a weld:

Warm. Dangerous. Beautiful. Controlled.

The technology should disappear. The craft should remain.


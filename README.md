# Rudraksh Goswami Portfolio

Personal portfolio of **Rudraksh Goswami**, AI engineer in Surat, India, building
AI agents, automation workflows and internal AI dashboards, on a foundation of two
years shipping production systems.

Static site: plain HTML, CSS and JavaScript. No build step, no framework, no
install. Open `index.html` and it works.

---

## Run it locally

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

> If you edit a `.js` file and don't see the change, your browser has cached the
> old module. Hard-reload with **Ctrl+Shift+R**.

---

## Files

| File | What it does |
|---|---|
| `index.html` | All the content and markup. Editable spots are marked with `EDIT`. |
| `flex-carousel.js` | WebGL project reel (OGL). `DEFAULT_ITEMS` at the top holds the projects. |
| `scroll-expand-media.js` | The About card that expands as you scroll. |
| `experience-section.js` | Horizontal timeline driven by vertical scroll. |
| `works-wheel.js` | 3D drum. Currently **parked**, and its data list is empty. See below. |
| `FlexCarousel.css` | Styles for the carousel captions. |
| `media/` | Every image the site uses. |
| `resume.pdf` | Linked from the header, footer and mobile menu. |

### What's in `media/`

| File | Used by |
|---|---|
| `rudraksh-cutout.avif` + `rudraksh-cutout.webp` | The hero. A transparent cut-out, so the figure stands in front of the big type instead of sitting in a box. Served through `<picture>`, same as the backdrop. AVIF keeps the alpha channel, so the cut-out and its drop shadow survive. |
| `rudraksh-portrait.webp` | Nothing on the page. It's the source frame for `og-card.png`. Keep it if you ever want to regenerate the card. |
| `og-card.png` | The 1200×630 picture LinkedIn, WhatsApp and Slack show when the link is pasted. Fetched by their crawlers, never by a visitor. |
| `about-backdrop.avif` + `about-backdrop.webp` | The starry backdrop behind the About section. Served through a `<picture>` block: browsers take the AVIF, and anything too old for it falls back to the WebP on its own. Both files are the same picture at the same size. |
| `about-feature.webp` | The artwork inside the About card that expands as you scroll. Stored at its full 2048x1092 native size, because the card grows to fill the viewport and a smaller file goes soft at that scale. |
| `blog-network.webp`, `helios-export.webp`, `sanmar-foods.webp` | The project reel. |
| `favicon.svg` | The browser tab. |

> **A note on image sizes.** `about-feature.webp` was once a 16 KB,
> 1600px downscale, which banded badly once the card expanded. It is now the
> full-resolution frame at quality 95 (70 KB). If you ever need to regenerate
> it, the lossless source is `about_floating_light.png` from the old `assets/`
> folder, which is in the Recycle Bin.

> **Replacing the hero photo.** It must be a cut-out with a real alpha
> channel. A photo with a white or black background will render as a
> rectangle over the title. `.hero-portrait-mask` in `index.html` fades the
> bottom edge so the shoulders dissolve into the page rather than ending on
> a hard crop line; adjust its gradient stops if your crop sits differently.

---

## Editing content

**Projects** live in one place: `DEFAULT_ITEMS` at the top of
`flex-carousel.js`. Copy a block, drop the screenshot in `media/`, point `src`
at it. Every field (`stats`, `tools`, `deliverables`, `link`) is read by the
detail modal. Leave a field out and that part of the modal is skipped.

> **Adding your AI projects.** There is a commented-out template at the top of
> `DEFAULT_ITEMS`, above the pipeline entry. Copy it once per project, uncomment
> it and fill it in. Omit `link` for internal work with no public URL. The modal
> just drops the "Visit Live Website" button. AI projects belong at the top of
> the array; the reel shows them in order.

**Experience** is in `index.html`, in the `#experience` section: one
`.exp-panel` block per chapter.

**Services** are the four `.accordion-item` blocks in the `#services` section.
`toggleService()` works off `document.querySelectorAll('.accordion-item')`, so a
fifth one needs no JavaScript change: copy a block, bump the badge number and
the `toggleService(n)` index, and add a matching `<option>` to the
`#contact-service` dropdown so the INQUIRE button can preselect it. Keep the
body short, because `.accordion-item.active .accordion-content` caps at 250px.

**Freelance availability** is stated in two places, and both need changing when
you stop taking work:

1. The pill under `AI ENGINEER / SURAT` in the hero, which links to `#services`.
2. The black `TAKING ON PROJECTS` band at the end of the `#services` section.

It lives inside `#services` rather than in a section of its own on purpose. The
nav is already six items wide at the `md` breakpoint, and the scroll-spy
observer watches `section[id], main[id], footer[id]` against a fixed map of nav
links, so a new top-level section with no matching nav entry would blank the
whole nav out while it was on screen.

**Contact details** appear in four places: the header icons, the About card, the
footer, and the JSON-LD block in `<head>`. Search for
`rudrakshgoswami5555@gmail.com` to find them all.

---

## The contact form

It posts to [Web3Forms](https://web3forms.com), which forwards submissions to
your inbox. Two things configure it, both on `<form id="contact-form">`:

- `action="https://api.web3forms.com/submit"`
- `data-access-key="..."`

The key is already in place and the form has been tested live: a real
submission was accepted in 528ms and arrived as email.

### About that key

A Web3Forms access key is meant to sit in client side HTML, so having it in
`index.html` is how it is designed to work and it is safe to commit. It is not a
password: the worst anyone can do with it is send you form mail, and the honeypot
plus Web3Forms' own rate limiting cover that. If it ever does get abused, request
a new key at [web3forms.com](https://web3forms.com) and replace the one attribute.

Replacing it with a key for a different address is the only change needed to
point the form somewhere else.

If `data-access-key` is ever emptied or left as a placeholder, the form does not
fire a request it knows will be refused. It opens the visitor's mail client
instead and says so.

### Why not FormSubmit

FormSubmit needs no key at all, which is why it was the first choice. It was
measured from this machine and it is unusable here:

| | CORS preflight | plain request |
|---|---|---|
| `formsubmit.co` | 17.6s, 13.0s, 9.4s | 8.0s |
| `api.web3forms.com` | 0.17s | 0.09s |
| `formspree.io` | 0.53s | 0.18s |

A JSON request body makes the request non-simple, so the browser sends a CORS
preflight and waits for it before the real send. With FormSubmit that preflight
alone was longer than the whole 20 second timeout, so the form reported
`it timed out` and nothing was ever delivered. That is a network and origin
problem, not a configuration one, and it would hit any visitor on an Indian
connection. Web3Forms answers the same request in under half a second.

The submission is sent as `FormData`, which is a simple request and needs no
preflight at all. One round trip, measured at 382ms from the browser.

### Changing provider

The handler reads the response body rather than trusting the status code,
because all three answer `200` while refusing. It understands all of them:

| Provider | `action` | Extra |
|---|---|---|
| Web3Forms | `https://api.web3forms.com/submit` | `data-access-key="..."` |
| Formspree | `https://formspree.io/f/xxxxxxx` | none |
| FormSubmit | `https://formsubmit.co/you@example.com` | none, but see the timings above |

A FormSubmit URL is rewritten to its `/ajax/` path at send time, because the
plain path answers with a redirect rather than JSON.

### What else is in there

- A honeypot carrying `botcheck`, `_honey` and `_gotcha`, one for each provider,
  so spam filtering survives a change. A submission with any of them filled is
  dropped silently and never sent.
- A 20 second timeout, so a hanging request cannot leave the button dead.
- On any failure the form keeps everything the visitor typed and names your
  email address, rather than clearing the box and claiming it sent.
- `action` sits on the form, not in the script, so it still posts with
  JavaScript disabled.
- Your email address is printed under the form either way, so there is never a
  dead end.

---

## The parked "Landing Pages" section

The 3D drum reel (`works-wheel.js`) is commented out in `index.html`, because
the original content was another developer's client work. That content and its
screenshots have been deleted, and `DEFAULT_WORKS` is now an empty array with a
template in the comment above it.

To bring it back for the 50+ blog network:

1. Put 4 to 6 blog screenshots in `media/`.
2. Fill in `DEFAULT_WORKS` at the top of `works-wheel.js`.
3. Un-comment three things in `index.html`: the section block, the init script
   near the bottom, and a nav link in the header.

**Before you do**, fix one thing in `works-wheel.js`: the stage element has the
class `touch-pan-x`, which sets `touch-action: pan-x`. On a phone that stops
vertical swipes from scrolling the page while the finger is over the drum, so
visitors get stuck. Change it to `touch-pan-y`.

---

## Before you share the link

The URL gets pasted into LinkedIn, Naukri and client emails, so these matter:

- [ ] Set your real domain in `<link rel="canonical">` and the `og:url` /
      `og:image` / `twitter:image` tags. They currently read
      `rudrakshgoswami.vercel.app`.
- [ ] `media/og-card.png` is the picture LinkedIn shows. It's generated and
      ready; just make sure the URL above points at it.
- [ ] Check the JSON-LD block in `<head>` is accurate. Google reads it.
- [ ] Keep `resume.pdf` current.
- [ ] Open it on your own phone, not just a narrow desktop window.

---

## Performance

A visit downloads **~497 KB** of this site's own files, or ~552 KB on a browser with no AVIF support. It was ~24 MB before:

| Change | Saved |
|---|---|
| Screenshots and artwork converted to WebP and resized | ~23 MB |
| Dropped the unused `@fiddle-digital/string-tune` runtime | 460 KB |
| Backdrop moved to AVIF with a light pre-blur | 64 KB |
| Hero cut-out moved to AVIF | 13 KB |

That library was downloaded on every visit and never actually did anything.
The horizontal timeline computes every effect itself from a scroll listener.
It is gone, along with its `node_modules` entry and its `package.json`
dependency, so there is nothing left to `npm install`.

The biggest single file left is the backdrop at ~127 KB. It is a dense brushstroke illustration, which is close to the worst case for any lossy codec, so quality settings alone barely moved it. What worked was AVIF plus a 0.5px pre-blur: the image is displayed with `object-cover` on a full-height box, so it is already upscaled on screen and that fine detail is interpolated away anyway, while costing real bytes. Tailwind
still comes from the CDN and compiles in the browser on every visit, and that's
the largest remaining cost overall. Replacing it with a built stylesheet is the
next worthwhile optimisation, but it needs a build step.

### Why `about-feature.webp` is not AVIF

It was tested and AVIF lost. That image is a dark, very smooth gradient with
faint striations in the light beam, and AVIF smooths exactly those away: at
45 KB the striations are gone, and matching the current WebP quality takes
about 109 KB against WebP's 70 KB. The two images that did convert are a dense
texture (the backdrop) and a photograph (the hero), which is where AVIF is
strong. Worth re-testing per image rather than assuming AVIF always wins.

### Files that were removed

The folder used to carry ~43 MB of material from the portfolio this design was
adapted from, plus leftovers from the build. All of it went to the Recycle Bin
(not hard-deleted), so it is recoverable if something turns out to be needed:

`assets/` · `Project Images/` · `Landing Page Assest/` · `extracted/` ·
`extracted_zip/` · `node_modules/` · `.agents/` · `FlexCarousel.tsx` ·
`ScrollExpandMedia.tsx` · `scratch_box.png` · `package-lock.json` ·
`stitch_monochrome_editorial_developer_portfolio.zip`

What's left is only what the site actually serves.

---

## Deploying

Static, so anything works and these are all free:

- **Vercel**: `npx vercel` from this folder.
- **Netlify**: drag the folder onto their dashboard.
- **GitHub Pages**: push, then Settings → Pages → branch `main`, folder `/`.

---

## Credits

The visual design and interaction components of this site originated in a
portfolio built by [Jishnu Mondal](https://github.com/Jishnu09-siuu), adapted
here with permission. All content, copy, projects and imagery are Rudraksh
Goswami's own.

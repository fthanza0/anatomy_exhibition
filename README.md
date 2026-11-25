# From Two Cells to Life

The companion website and presentation for our exhibit at the **Anatomy Working Model Making Competition cum Exhibition**. It covers the female reproductive system, the menstrual cycle, fertilization and the first week of development.

It is a plain static site: no build step, no frameworks, no outside services. It works on phones, laptops and projectors, and keeps working offline once it has been opened.

## What's inside

| Page | What it's for |
| --- | --- |
| `index.html` | The website visitors open on their phones: an interactive organ diagram, how an egg matures in the ovary, a 28-day cycle dial with a live hormone chart, the four hormones, the sperm's journey and fertilization, the first week, health and self-care, a 15-question quiz, a poster gallery with downloads, and a QR code. |
| `present.html` | Presentation mode for a laptop, TV or projector at the exhibit table: 12 slides covering everything on the site. |
| `anatomy_exhibition_website.html` | Redirects to the new site, so old links and QR codes still work. |

```
assets/
  css/site.css, present.css
  js/main.js, present.js, vendor/qrcode.min.js (MIT)
  fonts/two-cells-sans.woff2 (Atkinson Hyperlegible Next with an unslashed zero, SIL OFL 1.1)
  posters/  the 11 exhibition posters: 400px thumbnails, full-size WebP for viewing,
            the original JPEGs for download, and a ZIP of all of them
sw.js                 offline cache
manifest.webmanifest  lets visitors add the site to their home screen
```

The first visit downloads about 150 KB. The poster images load only when someone scrolls down to them.

To add a poster, put its thumbnail, WebP and JPEG in `assets/posters/` with the same naming pattern, add a `<li>` to the `#gallery` list in `index.html`, and rebuild the ZIP.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**. Under *Build and deployment*, pick **Deploy from a branch**, choose your branch and `/ (root)`, then save.
3. A minute later the site is live at `https://<your-username>.github.io/anatomy/`.

Once the site is live, the **Take it with you** section shows the correct QR code automatically. Use **Download PNG** or **Print** to put it on the exhibit table.

## Add your names

Open `index.html`, search for `EDIT`, and fill in the `<dd></dd>` fields (presenter, class, institution, date, venue). Rows left empty stay hidden. The title slide of presentation mode reads the same fields, so you only edit them once.

## Presentation mode

Open `present.html`, or follow the **Presentation mode** link in the footer.

| Key | Action |
| --- | --- |
| → / Space / Page Down | Next step or slide |
| ← / Page Up | Back |
| F | Full screen |
| K | Auto-play loop, for when nobody is at the table |
| Home / End | First or last slide |

Presentation clickers work without any setup. To start straight into the loop, open `present.html?kiosk`.

`present.html` is generated from `index.html`, because the slides reuse the same diagrams and text. After editing `index.html`, run `python3 tools/build_present.py` to update the slides.

## After editing

Increase `VERSION` in `sw.js` (for example `v1` → `v2`) so phones that already opened the site pick up your changes.

To preview on your computer, run `python3 -m http.server` in this folder and open http://localhost:8000.

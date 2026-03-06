# Simulation Source Code — Numerology Website

A multi-page numerology website with canvas animations, a numerology calculator, blog system, and a hidden admin CMS.

---

## File Structure

```
ssc-site/
│
├── index.html              ← Main entry point (loads all fragments)
│
├── css/
│   ├── style.css           ← All site styles (layout, components, animations)
│   └── admin.css           ← Admin CMS panel styles
│
├── js/
│   ├── app.js              ← Page routing, calculator, blog functions
│   ├── simulation.js       ← Canvas background animations (Layers 2/3/4)
│   └── admin.js            ← Blog CMS admin system
│
└── pages/
    ├── nav.html            ← Navigation bar + mobile menu
    ├── home.html           ← Homepage with simulation descent layers
    ├── calculator.html     ← Numerology calculator
    ├── books.html          ← Book recommendations
    ├── blog.html           ← Blog listing + all articles
    ├── about.html          ← About page
    ├── privacy.html        ← Privacy policy
    ├── footer.html         ← Site footer
    └── admin.html          ← Admin CMS overlay HTML
```

---

## Running Locally

This site uses `fetch()` to load HTML fragments, which requires a local server (browsers block `fetch()` on `file://` URLs).

**Option 1 — VS Code Live Server**
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html` → Open with Live Server.

**Option 2 — Python**
```bash
cd ssc-site
python3 -m http.server 8000
# Open http://localhost:8000
```

**Option 3 — Node (npx)**
```bash
cd ssc-site
npx serve .
```

---

## GitHub Pages Deployment

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set Source to **main branch / root**
4. Your site will be live at `https://yourusername.github.io/repo-name`

> The `.nojekyll` file is included so GitHub Pages serves the files as-is without Jekyll processing.

---

## Admin CMS

Write and publish blog posts without editing code.

**How to open:**
- Press `Ctrl + Shift + A` anywhere on the site
- Or navigate to `yoursite.com/#admin`
- Or click the © symbol in the footer **5 times fast**

**Default password:** `ssc2025`  
To change it, edit `var PASS = 'ssc2025'` in `js/admin.js`

**Tabs:**
- **Write** — Title, category, date, excerpt, and markdown body
- **Preview** — Live preview in the SSC style  
- **Posts** — Manage all dynamic posts (edit / delete)
- **Export** — Generate HTML to paste permanently into `pages/blog.html`

**Markdown supported:**
| Syntax | Result |
|--------|--------|
| `### Heading` | Section heading |
| `**bold**` | Bold text |
| `*italic*` | Italic text |
| `> quote` | Blockquote |
| blank line | New paragraph |

---

## Changing the Password

Open `js/admin.js` and find:
```js
var PASS = 'ssc2025';
```
Change it to any passphrase you like and save.

---

## Social Links

Update these in `pages/footer.html` and `pages/about.html`:
- Instagram: `https://www.instagram.com/simulationsourcecode`
- YouTube: `https://www.youtube.com/@kytholek`
- Website: `https://www.kytholek.com`

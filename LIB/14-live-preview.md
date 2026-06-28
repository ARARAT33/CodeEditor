# 14 — Live Preview

AWECode can preview websites (HTML/CSS/JS) live as you edit. The preview updates when you rebuild.

## How It Works

1. AWECode collects all your open web files (HTML, CSS, JS, images)
2. It sends them to `POST /api/preview` on the server
3. The server writes them to a temporary preview directory
4. A preview URL is returned: `/api/preview/<id>/index.html`
5. The URL is loaded in a sandboxed iframe

## Using Live Preview

1. Open one or more HTML/CSS/JS files in the editor (multi-tab)
2. Click the **Preview** button in the right panel (or top toolbar)
3. The preview appears in a split panel on the right
4. Click **Rebuild** to refresh after editing
5. Click **↗** to open the preview in a new browser tab

## Entry File

The preview needs an entry HTML file. By default, AWECode auto-detects `index.html`. You can change the entry file using the dropdown in the preview header.

## Sandboxing

The preview iframe is sandboxed with these capabilities:
- `allow-scripts` — JavaScript can run
- `allow-same-origin` — So relative URLs work
- `allow-forms` — Form submissions work
- `allow-popups` — `window.open` works
- `allow-modals` — `alert`/`confirm` work

## What's Supported

- ✅ Static HTML/CSS/JS sites
- ✅ Multiple HTML pages (link between them with `<a href="page2.html">`)
- ✅ External resources (CDN scripts, fonts, images)
- ✅ SVG, images, fonts
- ✅ Web manifests
- ❌ Server-side languages (PHP, Python, Ruby) — frontend only
- ❌ Build tools (Webpack, Vite, etc.) — use the terminal to build first

## Auto-Refresh

When you open a new HTML file, AWECode auto-generates a preview. To refresh after editing:
- Click **Rebuild** in the preview header
- Or click **Refresh** (↻) to reload the iframe without rebuilding

## Path Rewriting

For HTML files, AWECode automatically rewrites relative paths (src, href) to point to `/api/preview/<id>/...` so that assets load correctly. Absolute paths (starting with `http://`) and data URIs are left as-is.

## Use Cases

- Build a static landing page and see it live
- Prototype a React/Vue app (with CDN imports)
- Test CSS animations
- Debug HTML structure
- Show a client a quick mockup

## API

```bash
# Create a preview
curl -X POST http://your-host/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      { "path": "index.html", "content": "<h1>Hello</h1>" }
    ],
    "entry": "index.html"
  }'

# Response: { "ok": true, "previewId": "abc123", "url": "/api/preview/abc123/index.html" }

# Access the preview
curl http://your-host/api/preview/abc123/index.html
```

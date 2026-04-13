# Cusdis Comments Integration — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

Add a live commenting system to blog posts using [Cusdis](https://cusdis.com), a lightweight privacy-friendly commenting service. Visitors can leave comments (name + email required, no account) which are held for moderation before appearing publicly. The Cusdis widget co-exists with the existing archived WordPress comments (`comments.json`) on old posts.

---

## Architecture

No server-side code is added. The integration is purely client-side:

- A Cusdis `<script>` + `<div>` embed is added to `themes/vibe/layouts/blog/single.html`
- The Cusdis `app-id` is stored in `config.toml` under `[params]` and injected into the template via Hugo
- A small JS addition in `themes/vibe/static/js/main.js` handles dark/light theme sync
- CSS additions in `themes/vibe/static/css/style.css` style the wrapper card to match the existing design system

---

## Components

### 1. `config.toml`

Add a new param:

```toml
[params]
  cusdisAppId = "<your-cusdis-app-id>"
```

### 2. `single.html` — Cusdis widget block

Insert after the article content, **before** the existing `comments.json` block:

```html
{{ with .Site.Params.cusdisAppId }}
<section id="new-comments" class="comments">
  <div class="comments-card">
    <div class="comments-card-header">
      <h2 class="comments-title">
        <span class="material-symbols-rounded icon" aria-hidden="true">add_comment</span>
        Leave a Comment
      </h2>
    </div>
    <div class="comments-body">
      <div id="cusdis_thread"
        data-host="https://cusdis.com"
        data-app-id="{{ . }}"
        data-page-id="{{ $.Page.RelPermalink }}"
        data-page-url="{{ $.Page.Permalink }}"
        data-page-title="{{ $.Page.Title }}"
        data-theme="light">
      </div>
      <script async defer src="https://cusdis.com/js/cusdis.es.js"></script>
    </div>
  </div>
</section>
{{ end }}
```

### 3. `single.html` — archived comments block

Change the existing archived comments section to:
- Start collapsed by default (add `aria-expanded="false"` to the toggle button, `style="display:none"` to the body)
- Update the section heading to clarify it is archived content:

```html
<h2 class="comments-title">
  <span class="material-symbols-rounded icon" aria-hidden="true">forum</span>
  Archived Comments ({{ len $comments }})
</h2>
```

The existing `initCommentsToggle` JS already handles expand/collapse — no logic changes needed, only the default state flips.

### 4. `main.js` — Cusdis theme sync

Add a new `initCusdisTheme` function inside the existing IIFE:

```js
function initCusdisTheme() {
  const el = document.getElementById('cusdis_thread');
  if (!el) return;

  function applyTheme() {
    const theme = localStorage.getItem('prefers-theme') || 'light';
    el.dataset.theme = theme;
    if (window.CUSDIS) window.CUSDIS.setTheme(theme);
  }

  applyTheme();

  // Re-apply whenever the dark/light toggle fires
  document.addEventListener('themechange', applyTheme);
}
```

Wire it up in `DOMContentLoaded` alongside the other init calls:

```js
initCusdisTheme();
```

Also dispatch a `themechange` custom event from the existing dark/light toggle handler so `initCusdisTheme` can react to it.

### 5. `style.css` — no new classes needed

The Cusdis widget uses the existing `.comments`, `.comments-card`, `.comments-card-header`, `.comments-title`, and `.comments-body` classes. No new CSS is required.

---

## Data Flow

1. Visitor opens a blog post → Hugo renders the page with the Cusdis `<div>` containing `data-app-id`, `data-page-id`, `data-page-url`, `data-page-title`
2. Cusdis JS loads asynchronously → fetches approved comments for that page from `cusdis.com` and renders them inside the widget
3. Visitor submits a comment → Cusdis sends it to `cusdis.com` in a pending state
4. Site owner logs into `cusdis.com` dashboard → approves or rejects the comment
5. On next page load, approved comment appears in the Cusdis widget

---

## Behaviour by Post Type

| Post type | What appears |
|---|---|
| New post (no `comments.json`) | Cusdis widget only |
| Old post (has `comments.json`) | Cusdis widget, then collapsed "Archived Comments" card below |

---

## Error Handling

- If `cusdisAppId` is not set in `config.toml`, the entire Cusdis block is skipped (Hugo `{{ with }}` handles this)
- If the Cusdis script fails to load (network error, ad blocker), the `<div>` remains empty — no broken UI, just a blank card
- Archived comments are unaffected by Cusdis availability

---

## Out of Scope

- Email notifications to commenters when their comment is approved (Cusdis handles this natively on its paid tier; free tier sends notifications to the site owner only)
- Migrating future Cusdis comments into `comments.json` (deferred — this is the "switch to Netlify later" path)
- Spam filtering beyond Cusdis's built-in moderation queue

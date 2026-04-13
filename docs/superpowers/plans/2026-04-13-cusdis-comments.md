# Cusdis Comments Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Cusdis live commenting widget to every blog post, with dark/light theme sync and archived WordPress comments collapsed by default.

**Architecture:** Three files change — `config.toml` stores the Cusdis app ID, `single.html` renders the Cusdis embed and flips the archived comments to start collapsed, and `main.js` adds a theme-sync helper that reads/reacts to the existing `prefers-theme` localStorage key.

**Tech Stack:** Hugo (Go templates), vanilla JS, Cusdis (hosted SaaS, free tier)

---

## Pre-requisites (manual, one-time)

- [ ] Sign up at https://cusdis.com and create a new site
- [ ] Copy your **App ID** from the Cusdis dashboard — you will use it in Task 1

---

### Task 1: Add Cusdis app ID to config.toml

**Files:**
- Modify: `config.toml`

- [ ] **Step 1: Add the param**

Open `config.toml`. Inside the `[params]` block (after `enableDarkMode = true`), add:

```toml
cusdisAppId = "YOUR_APP_ID_HERE"
```

Replace `YOUR_APP_ID_HERE` with the App ID you copied from the Cusdis dashboard.

- [ ] **Step 2: Verify Hugo can read it**

Run the dev server:

```bash
hugo server -D
```

Expected: server starts without errors. No visible change to the site yet.

- [ ] **Step 3: Commit**

```bash
git add config.toml
git commit -m "config: add Cusdis app ID param"
```

---

### Task 2: Add Cusdis widget to single.html

**Files:**
- Modify: `themes/vibe/layouts/blog/single.html`

The widget is inserted inside `<article class="post-main prose">`, directly after `{{ .Content }}` and before the archived comments block (the `{{ $comments := slice }}` line).

- [ ] **Step 1: Insert the Cusdis block**

In `single.html`, find this line (line 28):

```html
        {{ .Content }}
```

Add the following immediately after it (before the `{{/* Load comments */}}` comment on line 30):

```html
        {{/* Cusdis live comments */}}
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

- [ ] **Step 2: Verify in browser**

With the dev server running, open any blog post (e.g. `http://localhost:1313/blog/posts/2007/mudhal-vanakkam/`).

Expected: a "Leave a Comment" card appears below the post content with a Cusdis comment form inside it.

- [ ] **Step 3: Commit**

```bash
git add themes/vibe/layouts/blog/single.html
git commit -m "feat: add Cusdis comment widget to blog posts"
```

---

### Task 3: Make archived comments start collapsed

**Files:**
- Modify: `themes/vibe/layouts/blog/single.html`

The existing `initCommentsToggle` in `main.js` reads `aria-expanded` to determine state and toggles `body.style.display`. Starting collapsed means setting `aria-expanded="false"` and `display:none` on the body in the template.

- [ ] **Step 1: Update the archived comments header**

In `single.html`, find the archived comments section heading (around line 44 after your Task 2 insertion). Change:

```html
              <h2 class="comments-title"><span class="material-symbols-rounded icon" aria-hidden="true">forum</span>
                Comments ({{ len $comments }})</h2>
```

to:

```html
              <h2 class="comments-title"><span class="material-symbols-rounded icon" aria-hidden="true">forum</span>
                Archived Comments ({{ len $comments }})</h2>
```

- [ ] **Step 2: Set the toggle button to collapsed state**

Find the toggle button in the same section:

```html
              <button id="comments-toggle" class="comments-toggle" aria-controls="comments-body" aria-expanded="true"
                title="Collapse comments">
                <span class="material-symbols-rounded icon">unfold_less</span>
              </button>
```

Change it to:

```html
              <button id="comments-toggle" class="comments-toggle" aria-controls="comments-body" aria-expanded="false"
                title="Expand comments">
                <span class="material-symbols-rounded icon">unfold_more</span>
              </button>
```

- [ ] **Step 3: Hide the comments body by default**

Find:

```html
            <div id="comments-body" class="comments-body">
```

Change it to:

```html
            <div id="comments-body" class="comments-body" style="display:none">
```

- [ ] **Step 4: Verify in browser**

Open an old blog post that has archived comments (e.g. `http://localhost:1313/blog/posts/2007/mudhal-vanakkam/`).

Expected:
- "Archived Comments (N)" card appears below the Cusdis widget, collapsed by default
- Clicking the toggle button expands and collapses it correctly
- The Cusdis "Leave a Comment" card above is unaffected

- [ ] **Step 5: Commit**

```bash
git add themes/vibe/layouts/blog/single.html
git commit -m "feat: archived comments start collapsed, relabelled as Archived"
```

---

### Task 4: Add dark/light theme sync for Cusdis

**Files:**
- Modify: `themes/vibe/static/js/main.js`

Two changes: (a) `toggleTheme()` dispatches a `themechange` custom event after applying the new theme; (b) a new `initCusdisTheme()` function sets the initial theme on the Cusdis widget and re-applies it whenever the theme changes.

- [ ] **Step 1: Dispatch themechange event from toggleTheme**

In `main.js`, find the `toggleTheme` function (lines 13–18):

```js
  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  }
```

Replace it with:

```js
  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, next);
    applyTheme(next);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  }
```

- [ ] **Step 2: Add initCusdisTheme function**

In `main.js`, add this function after `initCommentsToggle` (after line 103) and before `initSwiper`:

```js
  function initCusdisTheme() {
    const el = document.getElementById('cusdis_thread');
    if (!el) return;

    function applyToCusdis(theme) {
      el.dataset.theme = theme;
      if (window.CUSDIS) window.CUSDIS.setTheme(theme);
    }

    applyToCusdis(getPreferredTheme());

    document.addEventListener('themechange', function(e) {
      applyToCusdis(e.detail.theme);
    });
  }
```

- [ ] **Step 3: Wire up initCusdisTheme in DOMContentLoaded**

Find the `DOMContentLoaded` block. It ends with:

```js
    initCommentsToggle();
    initKavidhaiStack();
    initSwiper();
```

Change it to:

```js
    initCommentsToggle();
    initCusdisTheme();
    initKavidhaiStack();
    initSwiper();
```

- [ ] **Step 4: Verify theme sync in browser**

Open any blog post in the dev server.

Expected:
- On page load in light mode: the Cusdis iframe renders with a light background
- On page load in dark mode (toggle the theme): the Cusdis iframe renders with a dark background
- Toggling the theme button on the page: the Cusdis iframe updates to match within a second

- [ ] **Step 5: Commit**

```bash
git add themes/vibe/static/js/main.js
git commit -m "feat: sync Cusdis widget theme with site dark/light mode"
```

---

### Task 5: End-to-end verification

No code changes — manual verification pass before pushing.

- [ ] **Step 1: Check a new post (no comments.json)**

Open a post that has no archived comments.

Expected: only the "Leave a Comment" Cusdis card appears. No "Archived Comments" section.

- [ ] **Step 2: Check an old post (with comments.json)**

Open `http://localhost:1313/blog/posts/2007/mudhal-vanakkam/`.

Expected:
- "Leave a Comment" Cusdis card appears first
- "Archived Comments (N)" card appears below it, collapsed
- Expanding archived comments shows the migrated WordPress comments

- [ ] **Step 3: Check if cusdisAppId is missing (optional safety test)**

Temporarily comment out `cusdisAppId` in `config.toml`:

```toml
# cusdisAppId = "..."
```

Reload a blog post.

Expected: no "Leave a Comment" card at all — the `{{ with }}` block skips it cleanly. No broken UI.

Restore the line after verifying.

- [ ] **Step 4: Push to Netlify**

```bash
git push origin main
```

Open the deployed Netlify URL and repeat Steps 1–2 on the live site to confirm the Cusdis script loads over HTTPS without console errors.

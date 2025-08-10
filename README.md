### Pradep Vibe — Hugo Site

This is a Hugo site with a single-page home (About, Experience, Education) and a blog section. The nav includes smooth-scrolling to sections and a Blog link. A dark/light theme toggle is at the top-right.

### Run locally
- Install Hugo Extended
- From the repo root:
  - Development server: `hugo server -D`
  - Build static site: `hugo`

### Customize
- Site title/menus/hero/sections: `config.toml` (`[params]`)
- Homepage layout: `themes/vibe/layouts/index.html`
- Blog list: `themes/vibe/layouts/blog/list.html`
- Blog post page: `themes/vibe/layouts/blog/single.html`
- Styles: `themes/vibe/static/css/style.css`
- JS (theme toggle): `themes/vibe/static/js/main.js`
- Hero image: `themes/vibe/static/images/hero.svg`

### Content
- Blog index: `content/blog/_index.md`
- Sample posts: `content/blog/*.md`
- Add new post: create a Markdown file under `content/blog/` with front matter:

```markdown
---
title: "My Post Title"
date: 2025-01-01T10:00:00Z
description: "Optional summary"
tags: ["tag1", "tag2"]
draft: false
---

Your content here in Markdown.
```

### WordPress migration
- Export your posts from WordPress and convert to Markdown using your preferred tool (e.g., `wordpress-export-to-markdown` or the Hugo `hugo import` ecosystem tools).
- Drop the generated Markdown files into `content/blog/`. Keep any images under `static/` (or update image paths accordingly).

### Notes
- Section links use absolute root anchors (`/#about`, `/#experience`, `/#education`) so they work from any page.
- Smooth scrolling and section offset use CSS (`scroll-behavior: smooth;` and `scroll-margin-top`).

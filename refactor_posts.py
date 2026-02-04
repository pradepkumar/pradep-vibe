import os
import shutil
import re
import urllib.parse
from pathlib import Path

BLOG_ROOT = r"c:\Pradep\Github\pradep-vibe\content\blog\posts"

def refactor_post(year_dir, filename):
    filepath = os.path.join(year_dir, filename)
    slug = filename.replace('.md', '')
    
    # Create bundle directory
    bundle_dir = os.path.join(year_dir, slug)
    if os.path.exists(bundle_dir):
        print(f"Skipping {slug}, bundle already exists")
        return

    print(f"Refactoring {slug} in {year_dir}")
    
    try:
        os.makedirs(bundle_dir, exist_ok=True)
        
        # Read content
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Track found images to copy
        images_found = []
        
        def replacer(match):
            alt = match.group(1)
            url = match.group(2)
            
            # Extract filename from URL (handles https://.../foo.png and images/foo.png)
            parsed = urllib.parse.urlparse(url)
            filename = os.path.basename(parsed.path)
            
            # Check if this image exists in parent/images
            parent_images_dir = os.path.join(year_dir, "images")
            source_path = os.path.join(parent_images_dir, filename)
            
            if os.path.exists(source_path):
                images_found.append(source_path)
                return f"![{alt}](images/{filename})"
            else:
                # If not found locally, preserve original link
                return match.group(0)

        new_content = re.sub(r'!\[(.*?)\]\((.*?)\)', replacer, content)
        
        # If images found, copy them to bundle/images
        if images_found:
            bundle_images_dir = os.path.join(bundle_dir, "images")
            os.makedirs(bundle_images_dir, exist_ok=True)
            for img_path in images_found:
                fname = os.path.basename(img_path)
                dest = os.path.join(bundle_images_dir, fname)
                if not os.path.exists(dest):
                    shutil.copy2(img_path, dest)
                    print(f"  Copied {fname}")

        # Check if we should add header_image matching the first image found
        # (Optional: simplistic check to see if header_image is missing)
        if images_found and "header_image:" not in new_content:
             first_img = os.path.basename(images_found[0])
             # Insert after "tags:" or "categories:" or "date:"
             # Simple approach: Insert before the last closing ---
             parts = new_content.split('---', 2)
             if len(parts) >= 3:
                 frontmatter = parts[1]
                 new_frontmatter = frontmatter.rstrip() + f'\nheader_image: "images/{first_img}"\n'
                 new_content = f"---{new_frontmatter}---{parts[2]}"
                 print(f"  Added header_image: images/{first_img}")

        # Write new index.md
        with open(os.path.join(bundle_dir, 'index.md'), 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        # Remove original file (safe because we wrote the new one)
        os.remove(filepath)
        print(f"  Converted {filename} to {slug}/index.md")

    except Exception as e:
        print(f"Error processing {filename}: {e}")

# Walk years
if os.path.exists(BLOG_ROOT):
    for year in os.listdir(BLOG_ROOT):
        year_path = os.path.join(BLOG_ROOT, year)
        if os.path.isdir(year_path):
            for item in os.listdir(year_path):
                if item.endswith('.md') and item != 'index.md':
                    refactor_post(year_path, item)
else:
    print(f"Blog root not found: {BLOG_ROOT}")

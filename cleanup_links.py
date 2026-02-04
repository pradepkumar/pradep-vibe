import os
import shutil
import re
from pathlib import Path

BLOG_ROOT = r"c:\Pradep\Github\pradep-vibe\content\blog\posts"

def fix_and_cleanup():
    # 1. Walk through all year directories
    if not os.path.exists(BLOG_ROOT):
        print(f"Blog root not found: {BLOG_ROOT}")
        return

    for year in os.listdir(BLOG_ROOT):
        year_path = os.path.join(BLOG_ROOT, year)
        if not os.path.isdir(year_path):
            continue

        print(f"Processing year: {year}")

        # Post Bundles in this year
        for item in os.listdir(year_path):
            bundle_path = os.path.join(year_path, item)
            index_file = os.path.join(bundle_path, 'index.md')
            
            # If it's a directory and has index.md, it's a bundle
            if os.path.isdir(bundle_path) and os.path.exists(index_file):
                print(f"  Fixing links in {item}...")
                
                with open(index_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Regex matches: [ ![alt](img_url) ]( link_url )
                # We want to replace link_url with img_url if img_url is local
                
                def link_replacer(match):
                    full_match = match.group(0)
                    alt_text = match.group(1)
                    img_src = match.group(2)
                    link_href = match.group(3)
                    
                    # If the image source is local (begins with images/), use it for the link too
                    if img_src.startswith("images/"):
                        if "wordpress.com" in link_href:
                             print(f"    Replaced WP link: {link_href} -> {img_src}")
                             return f"[![{alt_text}]({img_src})]({img_src})"
                    
                    return full_match

                # Pattern: [ ![ (group1) ] (group2) ] (group3)
                # Note: This is slightly fragile if nested brackets, but standard markdown for linked images is consistent here.
                # Regex explanation:
                # \[           Literal [
                #   !\[(.*?)\] Match image alt text
                #   \((.*?)\)  Match image src
                # \]           Literal ]
                # \((.*?)\)    Match link href
                pattern = r'\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)'
                
                new_content = re.sub(pattern, link_replacer, content)
                
                if new_content != content:
                    with open(index_file, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print("    Saved changes.")
        
        # 2. Cleanup 'images' folder in year root
        images_dir = os.path.join(year_path, "images")
        if os.path.exists(images_dir) and os.path.isdir(images_dir):
            print(f"  Removing redundant directory: {images_dir}")
            try:
                shutil.rmtree(images_dir)
            except Exception as e:
                print(f"    Failed to remove {images_dir}: {e}")

if __name__ == "__main__":
    fix_and_cleanup()

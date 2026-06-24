import os
import glob

blog_dir = r"C:\Users\bhavy\.gemini\antigravity\scratch\carrobaar_drive_landing\blog"
html_files = glob.glob(os.path.join(blog_dir, "*.html"))

print(f"Found {len(html_files)} HTML files in {blog_dir}")

for filepath in html_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "blog.js" not in content:
        # We find </body> and insert the script before it
        script_tag = '<script src="blog.js"></script>\n</body>'
        new_content = content.replace("</body>", script_tag)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {os.path.basename(filepath)}")
    else:
        print(f"Already linked: {os.path.basename(filepath)}")

print("Automation script complete!")

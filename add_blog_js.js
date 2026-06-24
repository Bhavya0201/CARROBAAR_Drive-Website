const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
try {
    const files = fs.readdirSync(blogDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    console.log(`Found ${htmlFiles.length} HTML files in ${blogDir}`);

    htmlFiles.forEach(file => {
        const filePath = path.join(blogDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (!content.includes('blog.js')) {
            const scriptTag = '<script src="blog.js"></script>\n</body>';
            const newContent = content.replace('</body>', scriptTag);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${file}`);
        } else {
            console.log(`Already linked: ${file}`);
        }
    });

    console.log("Automation script complete!");
} catch (err) {
    console.error("Error running script:", err);
}

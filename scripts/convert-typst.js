const fs = require('fs');
const path = require('path');

/**
 * Converts a Typst academic book file to separate Markdown files for a Next.js wiki.
 * Assumes a simple Typst structure: chapters with =, sections with ==, callouts like #clinical_warning[...], #reflection[...], and citations like #cite<label>.
 * Outputs separate .md files per chapter with YAML frontmatter (title, description, category) and converts elements to MDX-compatible Markdown.
 *
 * Usage: node script.js <input.typ> <output-dir>
 */
function convertTypstToMarkdown(typstFilePath, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read and split the Typst file into lines
    const content = fs.readFileSync(typstFilePath, 'utf-8');
    const lines = content.split('\n');

    // Parse chapters: Start new chapter on lines beginning with '='
    const chapters = [];
    let currentChapter = null;
    let inChapter = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('=') && !line.startsWith('==')) {  // Chapter level (=, not ==)
            if (currentChapter) {
                chapters.push(currentChapter);
            }
            const title = line.replace(/^=+\s*/, '');
            currentChapter = {
                title: title,
                content: []
            };
            inChapter = true;
        }
        if (inChapter && currentChapter) {
            currentChapter.content.push(lines[i]); // Keep original line for processing
        }
    }
    if (currentChapter) {
        chapters.push(currentChapter);  // Add the last chapter
    }

    // Process each chapter into Markdown files
    let chapterIndex = 1;
    chapters.forEach(chapter => {
        const slug = slugify(chapter.title);
        const fileName = `${slug}.md`;
        const outputPath = path.join(outputDir, fileName);

        // Process chapter content
        let processedContent = processContent(chapter.content.join('\n'), chapter.title);

        // Build Markdown: Convert chapter title to #, add processed content
        let mdContent = `# ${chapter.title}\n\n${processedContent}`;

        // Generate frontmatter
        const frontmatter = `---\ntitle: "${chapter.title}"\ndescription: "Chapter ${chapterIndex}: ${chapter.title}"\ncategory: "Academic"\n---\n\n`;

        // Write the file
        fs.writeFileSync(outputPath, frontmatter + mdContent);
        console.log(`Generated: ${outputPath}`);
        chapterIndex++;
    });
}

/**
 * Processes the content of a chapter: Converts headings, callouts, and citations.
 * Assumes callouts are in the form #type[...content...] and citations are #cite<label>.
 */
function processContent(content, chapterTitle) {
    // Remove the chapter title line to avoid duplication
    content = content.replace(/^=+\s*.*$/gm, '').trim();

    // Convert sections (==) to Markdown headers (##)
    content = content.replace(/^==\s*(.*)$/gm, '## $1');

    // Handle any deeper headings if present (e.g., === to ###), though not specified
    content = content.replace(/^===\s*(.*)$/gm, '### $1');
    content = content.replace(/^====\s*(.*)$/gm, '#### $1');

    // Convert callouts to MDX components
    // Assumes simple content; for complex nested content, more parsing might be needed
    content = content.replace(/#clinical_warning\s*\[(.*?)\]/gs, (match, inner) => {
        // Convert inner content roughly (e.g., handle basic markup)
        const cleanedInner = inner.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');  // If bold is present
        return `<ClinicalWarning>\n${cleanedInner}\n</ClinicalWarning>`;
    });
    content = content.replace(/#reflection\s*\[(.*?)\]/gs, (match, inner) => {
        const cleanedInner = inner.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<Reflection>\n${cleanedInner}\n</Reflection>`;
    });

    // Handle callout box
    content = content.replace(/#callout\s*\[\s*title:\s*"([^"]+)"\s*\]\s*\[(.*?)\]/gs, (match, title, inner) => {
        return `<Callout title="${title}">\n${inner}\n</Callout>`;
    });

    // Preserve citations: Convert #cite<label> to Markdown footnote syntax [^label]
    // Assumes citation bodies are elsewhere; this just marks the reference
    content = content.replace(/#cite<([^>]+)>/g, '[^$1]');
    content = content.replace(/#cite\[([^\]]+)\]/g, '[^$1]');

    // Add footnote definitions if needed (placeholder; assumes citations are defined in a references section)
    // For simplicity, append a note if references are used
    if (content.includes('[^')) {
        content += '\n\n<!-- Footnotes -->\n';
    }

    // Handle other basic Typst to Markdown conversions (extend as needed)
    // E.g., inline code `code` -> `code`
    // Bold *text* -> **text**
    // Italics /text/ -> *text* (Typst uses / for italics)
    content = content.replace(/\*(.*?)\*/g, '**$1**');  // Bold
    content = content.replace(/\/([^\/]+)\//g, '*$1*');  // Italics
    content = content.replace(/`(.*?)`/g, '`$1`');      // Inline code

    return content;
}

/**
 * Slugifies a string for use in filenames.
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove non-word chars
        .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
}

// Command-line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error('Usage: node convert-typst.js <input.typ> <output-dir>');
        process.exit(1);
    }
    const [typstFilePath, outputDir] = args;
    if (!fs.existsSync(typstFilePath)) {
        console.error(`Input file does not exist: ${typstFilePath}`);
        process.exit(1);
    }
    convertTypstToMarkdown(typstFilePath, outputDir);
}

module.exports = { convertTypstToMarkdown, slugify };

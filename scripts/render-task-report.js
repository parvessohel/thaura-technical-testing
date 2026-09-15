const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const root = path.resolve(__dirname, '..');
const sourcePath = path.resolve(process.argv[2] || path.join(root, 'reports', 'task02', 'TASK-02-BUG-REPORT.md'));
const outputPath = path.resolve(process.argv[3] || path.join(root, 'reports', 'task02', 'TASK-02-BUG-REPORT.html'));

if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing Markdown report: ${sourcePath}`);
}

const markdown = fs.readFileSync(sourcePath, 'utf8');
const body = marked.parse(markdown, { gfm: true, headerIds: true });
const generatedAt = new Date().toISOString();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Task 02: Thaura.ai Website Technical Testing Report</title>
<style>
:root { color-scheme: light; font-family: Segoe UI, sans-serif; color: #17212b; background: #eef2f5; }
body { margin: 0; }
main { max-width: 1180px; margin: 0 auto; padding: 36px 22px 64px; }
article { background: #fff; border: 1px solid #d6dee6; border-radius: 8px; padding: 36px 42px; box-shadow: 0 4px 16px rgb(20 40 60 / 8%); }
h1 { margin-top: 0; padding-bottom: 18px; border-bottom: 3px solid #176b87; font-size: 32px; }
h2 { margin-top: 34px; padding-top: 14px; border-top: 1px solid #dce3e8; color: #14566e; }
h3 { margin-top: 26px; color: #273d4a; }
p, li { line-height: 1.65; }
code { padding: 2px 5px; border-radius: 4px; background: #edf1f4; font-family: Consolas, monospace; font-size: .92em; }
pre { overflow-x: auto; padding: 14px; border-radius: 6px; background: #17212b; color: #f3f7fa; }
pre code { padding: 0; background: transparent; }
table { width: 100%; margin: 18px 0 24px; border-collapse: collapse; font-size: 14px; }
th, td { padding: 10px 11px; border: 1px solid #d9e1e7; text-align: left; vertical-align: top; }
th { background: #eaf1f4; color: #214553; }
tr:nth-child(even) { background: #f8fafb; }
a { color: #056b8d; }
blockquote { margin: 20px 0; padding: 12px 18px; border-left: 4px solid #e0a126; background: #fff8e8; }
.meta { margin: -4px 0 26px; color: #667784; font-size: 13px; }
@media (max-width: 760px) { main { padding: 16px 10px 36px; } article { padding: 24px 18px; } h1 { font-size: 26px; } table { display: block; overflow-x: auto; white-space: normal; } }
@media print { :root { background: #fff; } main { max-width: none; padding: 0; } article { border: 0; box-shadow: none; padding: 0; } a { color: inherit; text-decoration: none; } }
</style>
</head>
<body>
<main>
<article>
<p class="meta">Generated ${generatedAt} from <code>TASK-02-BUG-REPORT.md</code></p>
${body}
</article>
</main>
</body>
</html>
`;

fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Rendered ${outputPath}`);

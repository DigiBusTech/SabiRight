const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Reading README.md...');
  const readmePath = path.resolve(__dirname, '../README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Convert via marked
  console.log('Converting markdown to HTML via marked...');
  const tempMdPath = path.resolve(__dirname, 'temp_readme.md');
  const tempHtmlBodyPath = path.resolve(__dirname, 'temp_body.html');
  fs.writeFileSync(tempMdPath, readmeContent, 'utf8');

  execSync(`npx marked -i "${tempMdPath}" -o "${tempHtmlBodyPath}" --gfm`, { stdio: 'inherit' });
  const htmlBody = fs.readFileSync(tempHtmlBodyPath, 'utf8');

  // Build full professional HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SabiRight Enterprise Platform — Technical Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover / Header section */
    .doc-header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .doc-badge {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #0284c7;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 10px;
    }

    .doc-title {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      line-height: 1.2;
    }

    .doc-subtitle {
      font-size: 11pt;
      color: #475569;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }

    .doc-meta {
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    /* Typography */
    h1 {
      font-size: 16pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #cbd5e1;
      page-break-after: avoid;
      break-after: avoid;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #0369a1;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #0f172a;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
      break-after: avoid;
    }

    p, li {
      margin-top: 0;
      margin-bottom: 8px;
      color: #334155;
    }

    ul, ol {
      margin-top: 4px;
      margin-bottom: 12px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Links */
    a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 500;
    }

    /* Blockquotes */
    blockquote {
      margin: 12px 0;
      padding: 10px 16px;
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      border-radius: 0 8px 8px 0;
      color: #334155;
      font-style: italic;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Code & Pre */
    code {
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0369a1;
      padding: 1.5px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 8pt;
      line-height: 1.45;
      background: #f8fafc;
      color: #0f172a;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      overflow-x: auto;
      margin: 12px 0;
      white-space: pre-wrap;
      word-break: break-word;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Badges & Images */
    img {
      max-width: 100%;
      height: auto;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }

    /* Avoid orphans in printing */
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>

  <div class="doc-header">
    <div class="doc-badge">Official Technical Dossier</div>
    <div class="doc-title">⚖️ SabiRight — Civic Intellect & Justice Infrastructure</div>
    <div class="doc-subtitle">Omnichannel AI Legal First-Aid, Sovereign Nigerian Multilingual Intelligence (N-ATLAS), Accredited Practitioner Directory & Statutory De-Escalation Architecture</div>
    <div class="doc-meta">
      <span><strong>Organization:</strong> Sabi AI Technologies Ltd</span>
      <span><strong>Model Core:</strong> Sovereign N-ATLAS (NCAIR1/N-ATLaS)</span>
      <span><strong>Framework:</strong> NITDA / NCAIR / NAIC Challenge</span>
      <span><strong>Document Version:</strong> 2.5 (Enterprise Release)</span>
      <span><strong>Date:</strong> October 2026</span>
    </div>
  </div>

  <div class="doc-content">
    ${htmlBody}
  </div>

</body>
</html>`;

  const finalHtmlPath = path.resolve(__dirname, 'technical_documentation.html');
  fs.writeFileSync(finalHtmlPath, fullHtml, 'utf8');
  console.log('HTML generated at:', finalHtmlPath);

  // Convert HTML to PDF using Chrome Headless
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPdfPath = path.resolve(__dirname, '../SabiRight_Technical_Documentation.pdf');

  console.log('Rendering PDF via Chrome headless...');
  const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "file:///${finalHtmlPath.replace(/\\/g, '/')}"`;
  
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF successfully created at:', outputPdfPath);

  // Clean up temp files
  try {
    fs.unlinkSync(tempMdPath);
    fs.unlinkSync(tempHtmlBodyPath);
    fs.unlinkSync(finalHtmlPath);
  } catch (e) {}

  const stats = fs.statSync(outputPdfPath);
  console.log(`Finished! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('PDF Generation failed:', err);
  process.exit(1);
});


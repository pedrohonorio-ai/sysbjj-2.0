import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'i18n'];

// Helper to recursively get files
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        getFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Simple rules to scan files for hardcoded strings
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip imports, console logs, dynamic comments, i18n keys
    if (line.trim().startsWith('import') || line.trim().startsWith('*') || line.trim().startsWith('//') || line.trim().startsWith('console.')) {
      return;
    }

    // 1. Check for JSX text (simple match: text between opening and closing tags, not containing braces, and contains alphabet characters)
    // Ex: <span>Save</span> but not <span className="...">
    // Or plain text directly under a div
    const jsxTextRegex = />\s*([a-zA-ZÁ-ú]{2,}(?:\s+[a-zA-ZÁ-ú&,\.\!\?-]+)*)\s*</g;
    let match;
    while ((match = jsxTextRegex.exec(line)) !== null) {
      const text = match[1];
      if (!text.includes('{') && !text.includes('}')) {
        fileIssues.push({ lineNum, type: 'JSX Text', line: line.trim(), detail: text });
      }
    }

    // 2. Check for toast literals
    // Ex: toast.success("Enrolled")
    const toastRegex = /toast\.(success|error|warning|info|loading)\(\s*(["'`])(.*?)\2\s*(?:,|\))/g;
    while ((match = toastRegex.exec(line)) !== null) {
      const toastText = match[3];
      // If it resembles an i18n key like common.save or student.success, skip. Better yet check if it has spaces or capital letters not keylike
      if (toastText.includes(' ') || toastText.toUpperCase() !== toastText && toastText.match(/[a-zA-Z]/)) {
        if (!toastText.startsWith('common.') && !toastText.includes('.')) {
          fileIssues.push({ lineNum, type: 'Toast Literal', line: line.trim(), detail: toastText });
        }
      }
    }

    // 3. Check for alert/confirm literals
    // Ex: confirm("Are you sure?")
    const alertConfirmRegex = /(alert|confirm)\(\s*(["'`])(.*?)\2\s*\)/g;
    while ((match = alertConfirmRegex.exec(line)) !== null) {
      const alertText = match[3];
      if (!alertText.startsWith('t(') && !alertText.includes('.')) {
        fileIssues.push({ lineNum, type: 'Alert/Confirm Literal', line: line.trim(), detail: alertText });
      }
    }
  });

  return fileIssues;
}

function runScanner() {
  console.log('=== STARTING GLOBAL LITERALLY HARDCODED TEXT AUDIT ===');
  const files = getFiles(SRC_DIR);
  let totalIssues = 0;
  const reports = {};

  for (const file of files) {
    const issues = scanFile(file);
    if (issues.length > 0) {
      reports[file] = issues;
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log('🎉 Outstanding! No hardcoded raw strings found outside of translations in JSX/toasts/alerts.');
  } else {
    console.log(`⚠️ Found ${totalIssues} potential hardcoded string occurrences across ${Object.keys(reports).length} files:`);
    for (const [file, issues] of Object.entries(reports)) {
      console.log(`\nFile: ${file}`);
      issues.forEach(issue => {
        console.log(`  Line ${issue.lineNum} [${issue.type}]: "${issue.detail}" -> \`${issue.line}\``);
      });
    }
  }
  console.log('=== AUDIT COMPLETE ===');
}

runScanner();

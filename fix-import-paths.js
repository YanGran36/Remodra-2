const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix import paths in a file
function fixImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix useToast imports
  const useToastRegex = /import\s+\{\s*useToast\s*\}\s+from\s+['"]\.\.\/\.\.\/hooks\/use-toast['"]/g;
  if (useToastRegex.test(content)) {
    content = content.replace(useToastRegex, "import { useToast } from '../hooks/use-toast'");
    modified = true;
    console.log(`Fixed useToast import in: ${filePath}`);
  }
  
  // Fix toast imports
  const toastRegex = /import\s+\{\s*toast\s*\}\s+from\s+['"]\.\.\/\.\.\/hooks\/use-toast['"]/g;
  if (toastRegex.test(content)) {
    content = content.replace(toastRegex, "import { toast } from '../hooks/use-toast'");
    modified = true;
    console.log(`Fixed toast import in: ${filePath}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return modified;
}

// Main execution
console.log('🔧 Fixing import paths...');

const clientDir = path.join(__dirname, 'client', 'src');
const tsxFiles = findTsxFiles(clientDir);

let fixedCount = 0;
for (const file of tsxFiles) {
  if (fixImportPaths(file)) {
    fixedCount++;
  }
}

console.log(`✅ Fixed ${fixedCount} files`);
console.log('🎉 Import path fixes completed!'); 
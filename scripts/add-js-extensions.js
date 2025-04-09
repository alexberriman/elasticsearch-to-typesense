import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Regular expressions to match imports without .js extension
const relativeDotImport = /(from\s+["']\.\/)([\w\-\/]+)(["'])/g;
const relativeDotDotImport = /(from\s+["']\.\.\/)([\w\-\/]+)(["'])/g;

/**
 * Process a file to add .js extensions to its import statements
 * @param {string} filePath - Path to the file
 */
function processFile(filePath) {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace imports
    content = content.replace(relativeDotImport, '$1$2.js$3');
    content = content.replace(relativeDotDotImport, '$1$2.js$3');

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

/**
 * Walk the directory and process all TypeScript files
 * @param {string} dir - Directory to walk
 */
function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (file !== 'node_modules' && file !== 'dist') {
          walkDir(filePath);
        }
      } else if (file.endsWith('.ts')) {
        processFile(filePath);
      }
    }
  } catch (err) {
    console.error(`Error walking directory ${dir}:`, err);
  }
}

// Start processing from the src and tests directories
walkDir(path.join(rootDir, 'src'));
walkDir(path.join(rootDir, 'tests'));
console.log('Finished updating import statements');
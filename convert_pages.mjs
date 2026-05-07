import fs from 'fs';

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<!--/g, '{/*')
    .replace(/-->/g, '*/}')
    .replace(/<img([^>]*[^/])>/g, '<img$1 />')
    .replace(/<input([^>]*[^/])>/g, '<input$1 />')
    .replace(/<br([^>]*[^/])>/g, '<br$1 />')
    .replace(/style="([^"]+)"/g, (match, styleString) => {
      const styleObj = {};
      styleString.split(';').forEach(rule => {
        if (!rule.trim()) return;
        const [key, value] = rule.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
          styleObj[camelKey] = value;
        }
      });
      return `style={${JSON.stringify(styleObj)}}`;
    });
}

function extractMain(html) {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (match) {
    return htmlToJsx(match[1]);
  }
  return '';
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (match) {
    return htmlToJsx(match[1]);
  }
  return '';
}

// Sales
const salesHtml = fs.readFileSync('/tmp/sales.html', 'utf-8');
const salesContent = extractMain(salesHtml);
if (!fs.existsSync('app/sales')) fs.mkdirSync('app/sales', { recursive: true });
fs.writeFileSync('app/sales/page.tsx', `
export default function SalesPage() {
  return (
    <div className="w-full h-full">
      ${salesContent}
    </div>
  );
}
`);

// Inventory
const inventoryHtml = fs.readFileSync('/tmp/inventory.html', 'utf-8');
const inventoryContent = extractMain(inventoryHtml);
if (!fs.existsSync('app/inventory')) fs.mkdirSync('app/inventory', { recursive: true });
fs.writeFileSync('app/inventory/page.tsx', `
export default function InventoryPage() {
  return (
    <div className="w-full h-full">
      ${inventoryContent}
    </div>
  );
}
`);

// Directory
const directoryHtml = fs.readFileSync('/tmp/directory.html', 'utf-8');
const directoryContent = extractMain(directoryHtml);
if (!fs.existsSync('app/directory')) fs.mkdirSync('app/directory', { recursive: true });
fs.writeFileSync('app/directory/page.tsx', `
export default function DirectoryPage() {
  return (
    <div className="w-full h-full">
      ${directoryContent}
    </div>
  );
}
`);

// Login
const loginHtml = fs.readFileSync('/tmp/login.html', 'utf-8');
const loginContent = extractBody(loginHtml);
if (!fs.existsSync('app/login')) fs.mkdirSync('app/login', { recursive: true });
fs.writeFileSync('app/login/page.tsx', `
export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-surface text-on-surface antialiased min-h-screen flex flex-col md:flex-row">
      ${loginContent}
    </div>
  );
}
`);

console.log('Pages generated.');

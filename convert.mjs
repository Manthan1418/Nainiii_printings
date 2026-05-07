import fs from 'fs';
import path from 'path';

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
      // Very basic inline style converter
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

function extractLayout(dashboardHtml) {
  const topNavMatch = dashboardHtml.match(/<!-- TopAppBar -->\n([\s\S]*?)<\/header>/);
  const topNav = topNavMatch ? topNavMatch[1] + '</header>' : '';

  const sidebarMatch = dashboardHtml.match(/<!-- NavigationDrawer \(Sidebar\) - Hidden on Mobile -->\n([\s\S]*?)<\/aside>/);
  const sidebar = sidebarMatch ? sidebarMatch[1] + '</aside>' : '';

  const bottomNavMatch = dashboardHtml.match(/<!-- BottomNavBar - Mobile Only -->\n([\s\S]*?)<\/nav>\n<\/body>/);
  const bottomNav = bottomNavMatch ? bottomNavMatch[1] + '</nav>' : '';

  const mainMatch = dashboardHtml.match(/<!-- Main Content Area -->\n([\s\S]*?)<\/main>/);
  const mainContent = mainMatch ? mainMatch[1] + '</main>' : '';

  return {
    topNav: htmlToJsx(topNav),
    sidebar: htmlToJsx(sidebar),
    bottomNav: htmlToJsx(bottomNav),
    mainContent: htmlToJsx(mainContent)
  };
}

const dashboardHtml = fs.readFileSync('/tmp/dashboard.html', 'utf-8');
const layout = extractLayout(dashboardHtml);

fs.writeFileSync('components/Navbar.tsx', `
import Link from 'next/link';

export default function Navbar() {
  return (
    ${layout.topNav}
  );
}
`);

fs.writeFileSync('components/Sidebar.tsx', `
import Link from 'next/link';

export default function Sidebar() {
  return (
    ${layout.sidebar}
  );
}
`);

fs.writeFileSync('components/BottomNav.tsx', `
import Link from 'next/link';

export default function BottomNav() {
  return (
    ${layout.bottomNav}
  );
}
`);

fs.writeFileSync('app/page.tsx', `
export default function Dashboard() {
  return (
    ${layout.mainContent}
  );
}
`);

console.log('Layout extracted successfully');

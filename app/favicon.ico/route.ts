export function GET() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#111827" />
      <path d="M18 46V18h12.5c4.1 0 7.1 0.9 9.1 2.7 2 1.8 3 4.2 3 7.2 0 2.1-0.5 3.9-1.6 5.4-1 1.5-2.5 2.7-4.3 3.5L45 46H36.3l-7.1-8.2H27.2V46H18zm9.2-14.8h3.1c1.7 0 3-0.3 3.9-1 0.9-0.7 1.4-1.8 1.4-3.1 0-1.4-0.5-2.4-1.4-3.1-0.9-0.7-2.2-1-3.9-1h-3.1v8.2z" fill="#ffffff"/>
    </svg>
  `.trim()

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
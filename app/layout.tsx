import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Nainiii Printing ERP',
  description: 'Internal admin ERP for Nainiii Printing',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-md text-body-md antialiased bg-background text-on-background">
        {children}
      </body>
    </html>
  )
}

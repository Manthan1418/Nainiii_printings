"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle(){
  const [theme, setTheme] = useState<'light'|'dark'>(() => typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light'|'dark'|null
    if (saved) setTheme(saved)
  }, [])

  return (
    <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark') } className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}

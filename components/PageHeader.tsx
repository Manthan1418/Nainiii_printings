"use client"
import React from 'react'

export default function PageHeader({ title, subtitle, actions }: { title: string, subtitle?: string, actions?: React.ReactNode }){
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}

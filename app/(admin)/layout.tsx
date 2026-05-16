import { ReactNode } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { Toaster } from '../../components/Toast'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-toolbar-height pb-16 md:pb-0">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] w-full">
        <Sidebar />
        {children}
      </div>
      <BottomNav />
      <Toaster />
    </div>
  )
}

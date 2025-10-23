import { Sidebar, MobileSidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/sonner'
import Image from 'next/image'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header Mobile */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <MobileSidebar />
          <div className="flex items-center flex-1 justify-center">
            <Image
              src="/logo.png"
              alt="ZoboliControl"
              width={160}
              height={48}
              className="h-auto"
              priority
            />
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

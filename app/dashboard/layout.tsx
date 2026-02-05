
import { Sidebar } from "@/components/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto p-0">
        {children}
      </main>
    </div>
  )
}

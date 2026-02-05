
export default function DashboardPage() {
  return (
    <div className="p-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Your Projects
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for project cards */}
            <div className="h-48 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
                <span className="text-gray-400">+ New Project</span>
            </div>
        </div>
    </div>
  )
}

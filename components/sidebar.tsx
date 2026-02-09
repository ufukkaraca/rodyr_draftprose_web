
"use client"
import Link from "next/link"
import { User } from "better-auth/types"
import { Button } from "@/components/ui/button"
import { 
    BookOpen, 
    Users, 
    MapPin, 
    FileText, 
    Trash2, 
    Search,
    ChevronDown,
    Settings,
    LogOut
} from "lucide-react"

export function Sidebar({ user }: { user: User | undefined }) {
  return (
    <aside className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-md flex flex-col h-full">
        <div className="p-4 border-b border-white/10">
            <h2 className="font-bold text-lg tracking-tight">Wryter</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
                <Link href="/editor" passHref>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Manuscript
                    </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                    <Users className="mr-2 h-4 w-4" />
                    Characters
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                    <MapPin className="mr-2 h-4 w-4" />
                    Places
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                    <FileText className="mr-2 h-4 w-4" />
                    Notes
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                    <Search className="mr-2 h-4 w-4" />
                    Research
                </Button>
            </div>

            <div className="pt-4 border-t border-white/10">
                 <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Trash
                </Button>
            </div>
        </div>

        <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0] || "U"}
                 </div>
                 <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                     <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                     <Settings className="h-4 w-4" />
                 </Button>
            </div>
        </div>
    </aside>
  )
}

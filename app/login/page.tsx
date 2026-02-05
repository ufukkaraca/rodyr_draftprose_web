
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Wryter
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your distraction-free AI writing studio
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all text-lg h-12">
              <Chrome className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
          </div>
          <p className="text-center text-xs text-gray-400">
            By clicking continue, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

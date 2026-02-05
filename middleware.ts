
import { auth } from "@/auth"

export default auth((req) => {
  // custom logic if needed
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

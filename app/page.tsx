
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <main className="flex flex-col items-center gap-8 text-center p-8">
        <h1 className="text-6xl font-bold tracking-tight">DraftProse</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          The distraction-free, AI-powered writing studio for focused creatives.
          Plan, write, and refine your masterpiece.
        </p>
        
        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg">Learn More</Button>
          </Link>
        </div>
      </main>
      
      <footer className="mt-20 text-sm text-muted-foreground">
        <p>&copy; 2026 DraftProse. All rights reserved.</p>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    await authClient.signIn.email({
        email,
        password,
    }, {
        onSuccess: () => {
             router.push("/dashboard");
        },
        onError: (ctx: any) => {
             alert(ctx.error.message);
             setLoading(false);
        }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your DraftProse account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleSignIn} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={async () => {
              const demoCreds = {
                email: "demo@draftprose.com",
                password: "password123",
                name: "Demo Writer"
              };
              
              setLoading(true);
              setEmail(demoCreds.email);
              setPassword(demoCreds.password);

              try {
                // 1. Try Sign In
                await authClient.signIn.email({
                    email: demoCreds.email,
                    password: demoCreds.password,
                }, {
                    onSuccess: () => router.push("/dashboard"),
                    onError: async (ctx) => {
                        // 2. If User Not Found, Try Register
                        if (ctx.error.status === 401 || ctx.error.status === 404 || ctx.error.message?.includes("record not found") || ctx.error.message?.includes("Invalid email or password")) {
                            const tryRegister = async () => {
                                await authClient.signUp.email({
                                    email: demoCreds.email,
                                    password: demoCreds.password,
                                    name: demoCreds.name,
                                }, {
                                    onSuccess: async () => {
                                        // 3. Seed Data
                                        try {
                                            await fetch("/api/setup/demo", { method: "POST" });
                                            router.push("/dashboard");
                                        } catch (e) {
                                            console.error("Seeding failed", e);
                                            router.push("/dashboard");
                                        }
                                    },
                                    onError: async (e) => {
                                        // 4. If Register Failed (likely user exists but password mismatch from bad seed), Reset & Retry
                                        if (e.error.status === 422 || e.error.message?.includes("exists")) {
                                            try {
                                                await fetch("/api/setup/demo", { method: "DELETE" });
                                                // Retry register once, purely recursive or just call it? 
                                                // Let's just call the logic again manually to avoid infinite loop risk, just one level deep
                                                 await authClient.signUp.email({
                                                    email: demoCreds.email,
                                                    password: demoCreds.password,
                                                    name: demoCreds.name,
                                                }, {
                                                    onSuccess: async () => {
                                                        await fetch("/api/setup/demo", { method: "POST" });
                                                        router.push("/dashboard");
                                                    },
                                                    onError: (finalErr) => {
                                                         setLoading(false);
                                                         alert("Demo recovery failed: " + finalErr.error.message);
                                                    }
                                                });
                                            } catch (resetErr) {
                                                setLoading(false);
                                                alert("Could not reset demo account.");
                                            }
                                        } else {
                                            setLoading(false);
                                            alert("Demo setup failed: " + e.error.message);
                                        }
                                    }
                                });
                            };
                            await tryRegister();
                        } else {
                            setLoading(false);
                            alert(ctx.error.message);
                        }
                    }
                });
              } catch (err) {
                  setLoading(false);
                  console.error(err);
              }
            }}
            disabled={loading}
          >
            Enter Demo Mode
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

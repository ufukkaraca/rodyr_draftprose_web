"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DemoControls() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/setup/demo", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        setError("Failed to reset demo data. Please try again.");
        setLoading(false); 
      }
    } catch (e) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) setError(""); // Clear error on close
        setOpen(val);
      }}>
        <DialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            className="shadow-lg opacity-80 hover:opacity-100 transition-opacity"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Demo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Demo Data?</DialogTitle>
            <DialogDescription>
              This will delete all current data in the demo project and restore the "The Neon Archive" template. 
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={loading}>
              {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Resetting..." : "Yes, Reset Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

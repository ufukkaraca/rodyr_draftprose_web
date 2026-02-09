"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function DemoControls() {
  const [loading, setLoading] = useState(false);
  // We can't easily use toast here without the Toaster component in layout, 
  // ensuring it's there is handled by the user usually.
  // We'll just use window.alert or basic feedback for this hackathon feature.

  const handleReset = async () => {
    if (!confirm("Reset all demo data? This will erase changes.")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/setup/demo", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to reset demo data");
      }
    } catch (e) {
      alert("Error resetting data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="destructive" 
        size="sm" 
        className="shadow-lg opacity-80 hover:opacity-100 transition-opacity"
        onClick={handleReset}
        disabled={loading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Reset Demo
      </Button>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Editor } from "./components/Editor";
import { Corkboard } from "./components/Corkboard";
import { DashboardShell } from "./components/DashboardShell";

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'editor' | 'corkboard'>('editor');

  return (
    <DashboardShell viewMode={viewMode} onViewModeChange={setViewMode}>
       {viewMode === 'editor' ? <Editor /> : <Corkboard />}
    </DashboardShell>
  )
}

"use client";

import React, { useState } from "react";
import { Editor } from "./components/Editor";
import { Corkboard } from "./components/Corkboard";
import { DashboardShell } from "./components/DashboardShell";

import { useProjectStore } from "./store/useProjectStore";

export default function DashboardPage() {
  const viewMode = useProjectStore((state) => state.viewMode);
  const setViewMode = useProjectStore((state) => state.setViewMode);

  return (
    <DashboardShell viewMode={viewMode} onViewModeChange={setViewMode}>
       {viewMode === 'editor' ? <Editor /> : <Corkboard />}
    </DashboardShell>
  )
}

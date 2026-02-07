# DraftProse Product Requirements Document (PRD)

**Version:** 1.0 (Post-Audit)
**Goal:** Build the ultimate "AI-Native Scrivener"—a tool that offers the deep organization of Scrivener with the modern aesthetics and intelligence of 2024 web tech.

## 1. Core Principles
1.  **Monochrome Focus:** The interface should never compete with the words.
2.  **Structural Freedom:** Users don't just "write files"; they "build manuscripts" (Binder).
3.  **AI as Muse:** AI is a sidebar companion (Chat) and a mechanic (Synopsis generation), not just a text generator.

## 2. Feature Roadmap

### Phase 1: The "Structure" (Closing the Critical Gaps)
*Focus: Allowing users to actually organize a book.*

*   **Binder 2.0 (Drag & Drop):**
    *   Implement Drag-and-Drop reordering and nesting using `dnd-kit` or similar.
    *   Folder vs. File distinction (Folders can have text too).
    *   **Ticket:** `DP-101: Implement Draggable Binder Tree`
*   **Inspector - Metadata:**
    *   **Synopsis:** Text area for "Brief" vs "Editor Content".
    *   **Notes:** Document-specific notes (separate from manuscript text).
    *   **Status/Label:** Customizable dropdowns (e.g., "Draft", "Done" | "Chapter", "Scene").
    *   **Ticket:** `DP-102: Enhanced Inspector Metadata`
*   **Snapshots (Versioning):**
    *   "Take Snapshot" button.
    *   View history of document changes.
    *   **Ticket:** `DP-103: Document Snapshots`

### Phase 2: The "Writer's Tools" (Closing High Gaps)
*   **Corkboard View:**
    *   View a folder's children as Index Cards (Title + Synopsis).
    *   Grid layout. Reorder via drag.
    *   **Ticket:** `DP-201: Corkboard View`
*   **Compiling (Export 1.0):**
    *   "Export Draft to PDF/Word".
    *   Simple logic: Concatenate all "Draft" folder text -> Convert to Output.
    *   **Ticket:** `DP-202: Manuscript Compilation`
*   **Word Count Targets:**
    *   Set Target (e.g., 50k words).
    *   Session Target (e.g., 500 words today).
    *   Visual progress bars (subtle, thin lines).
    *   **Ticket:** `DP-203: Writing Targets`

### Phase 3: The "AI Advantage" (Differentiating from Scrivener)
*   **Smart Synopsis:** "Read this chapter and generate the synopsis summary for me."
*   **Muse Chat Context:** Chat with your specific document or the whole draft (RAG).
*   **Character Chat:** "Talk to your characters." Select a character profile and chat with them to fetch voice/tone or interview them.
*   **Vibe Check:** "Analyze the tone of this scene vs the previous one."
*   **Ticket:** `DP-301: AI Writing Assistants`

### Phase 4: Scale & Polish
*   **Offline Support (Future):**
    *   *Delayed until after MVP.*
    *   Service Worker caching and local optimistic updates.

## 3. Technical Requirements
*   **Frontend:** Next.js 14, React 18, Tailwind, Shadcn UI.
*   **Editor:** TipTap (ProseMirror).
*   **State:** `zustand` for client-side optimistic UI, but **Single Source of Truth is the Database via API.**
*   **Data Layer (Cloud First):**
    *   **Auto-Save:** Changes are debounced and sent to API (`PUT /api/documents/:id`).
    *   **Loading States:** UI must show "Saving..." / "Saved" status.
    *   **Persistence:** PostgreSQL (Prisma). No mandatory local-first logic for MVP.
    *   **Schema:** `Project`, `Document` (Binder Node), `Snapshot`.

## 4. User Flows (See Feature Scenarios)
1.  **The "Planner":** Creates folders -> Adds cards to Corkboard -> Writes Synopses -> converts to text.
2.  **The "Pantser":** Writes in one doc -> Splits document into scenes -> Reorders in Binder.
3.  **The "Editor":** Takes Snapshot -> Rewrites scene -> Compares with Snapshot.

# DraftProse Audit Report

## 1. Coherence to Initial Requirements
**Goal:** Build a "Scrivener-style" writing studio with a "distraction-free Markdown editor", "AI integration", and "monochrome/clean" aesthetics.

### Status Assessment
*   **Aesthetics:** ✅ **High Coherence.** The current dashboard uses a monochrome, clean design (zinc/slate palette) with typewriter fonts for the editor, matching the "insanely clean" requirement.
*   **Layout:** ✅ **High Coherence.** The 3-pane layout (Binder, Editor, Inspector) successfully mimics Scrivener's core interface.
*   **Technology:** ✅ **High Coherence.** Built on Next.js, uses Tiptap (Markdown-friendly), and integrates Vercel AI SDK/Google Gemini.
*   **Functionality:** ⚠️ **Partial Coherence.** The editor works, sidebars toggle/resize (now fixed), and basic AI chat exists. However, deep project management (dragging in binder, nesting), specific writer tools (targets, snapshots), and robust export are missing.

## 2. Feature Gap Analysis (vs. Scrivener)

| Feature Category | Scrivener (Gold Standard) | DraftProse (Current) | Gap Severity |
| :--- | :--- | :--- | :--- |
| **Organization (Binder)** | Nested folders, drag-and-drop hierarchy, icons for research/characters/places. | Flat list or basic nesting (presumed), no drag-and-drop reordering, no specialized icon types. | 🔴 Critical |
| **Editor View** | Scrivenings (view multiple docs as one), Split Screen, Page View, Typewriter Scroll. | Single document view. No split screen. | 🔴 Critical |
| **Inspector (Metadata)** | Synopsis cards, Label/Status stamps, Custom Metadata, Notes, References, Keywords. | Basic implementations (likely placeholder or simple fields). | 🟠 High |
| **Corkboard** | Visual card view of sub-documents with synopsis. | ❌ Missing entirely. | 🟠 High |
| **Outliner** | Spreadsheet-like view of metadata (status, word count, target). | ❌ Missing entirely. | 🟠 High |
| **Research** | Import PDF, Webpages, Images directly into Binder. | Likely text-only or basic uploads. | 🟠 High |
| **Compiling (Export)** | Complex logic: "Compile Draft folder to PDF/ePub vs. Research folder". | Basic likely (or missing). | 🟠 High |
| **Writing Tools** | Word count targets (session & manuscript), Snapshots (versioning), Name Generator. | Basic stats (maybe). No Snapshots. | 🟠 High |
| **Saving/Backup** | Auto-save, Auto-backup on close, Snapshots. | Auto-save (likely via DB). No specific "Export Backup" flow. | 🟡 Medium |
| **AI Features** | N/A (Scrivener is manual). | Basic Chat. Missing: "Analyze Tone", "Auto-Summarize to Synopsis", "Continue text" inline. | 🟢 Opportunity |

## 3. Deployment & Scalability Gaps
*   **Database:** Current Prisma/Postgres setup is good, but need to ensure "Project" separation is robust (Multi-tenancy or just User-Project isolation).
*   **Offline Support:** Scrivener is local-first. Web apps rely on connection. `DraftProse` needs robust optimistic UI or PWA capabilities for "writing in a cabin" feel (or at least graceful offline handling).
*   **Performance:** Large manuscripts (100k+ words) in Tiptap need virtualization or "Scrivenings" lazy loading to not crash the browser.

## 4. Conclusion
DraftProse has nailed the **"Vibe"** and the **"Shell"**. It looks better than Scrivener. Now it needs the **"Brain"**—the deep organizational tools that make Scrivener essential for long-form writing (Drag-and-Drop Binder, Snapshots, Compile).

## 5. Phase 2b Audit Findings (Resolved)
During the Quality Audit, we identified and resolved critical regressions:

### 1. Binder Hierarchy Failure
- **Issue**: Binder folders (e.g., "Manuscript") appeared empty and titles were corrupted ("Chapter 1Chapter 1Manuscript").
- **Root Cause**: The `POST /api/documents` endpoint was stripping the provided `id` field, causing the database to generate a new random CUID. As a result, child items referencing the intended ID (e.g., `parentId="manuscript"`) became orphaned. The visual title corruption was a side effect of overlapping orphaned root items.
- **Fix**: Updated `api/documents` to respect the `id` field if provided.
- **Verification**: Created a robust `api/seed` endpoint to reset the demo project. Confirmed hierarchy is now correct and toggling works.

### 2. Compiler UI Clipping
- **Issue**: Dropdown menus in the Compiler dialog were at risk of being clipped by the modal bounds.
- **Fix**: Applied `z-[100]` and `overflow-visible` (where appropriate) to the `DialogContent` to ensure popovers render correctly on top.
- **Verification**: Verified using browser automation that the Font Family dropdown renders above the dialog.

# Gemini 3 Hackathon Submission Guide

**Project:** DraftProse
**Tagline:** The AI-native writing studio for long-form storytelling.

## 🏆 Judging Criteria Alignment

*   **Innovation:** DraftProse re-imagines the writing interface not as a static text editor, but as a dynamic "Project" with structural awareness (Binder), visual planning (Corkboard), and intelligent assistance (Muse). It solves the "blank page" problem and the "messy middle" of long-form writing.
*   **Impact:** Empowering writers to finish their books. The complexity of managing 50k+ words is the #1 reason writers quit. DraftProse automates the management.
*   **Design:** A clean, distraction-free environment (Focus Mode) coupled with powerful management tools (Binder/Inspector). It looks and feels like a premium modern app.
*   **Technical Implementation:** Built entirely with **Antigravity (powered by Gemini 3 Pro)**, leveraging **Gemini 3 Flash** for low-latency, high-throughput AI features within the app.

---

## ✅ Pre-Submission Checklist

### 1. Functional Polish (The "Happy Path")
- [ ] **Binder:** Verify drag-and-drop nesting works perfectly (Critical for "structure" narrative).
- [ ] **Writing:** Ensure typing is lag-free and "Focus Mode" feels immersive.
- [ ] **AI Muse:** Ensure the "Chat with Muse" feature returns responses quickly (using Gemini 3 Flash).
- [ ] **Corkboard:** Verify cards display correctly for chapters.
- [ ] **Compile:** Ensure the "Export to PDF/Docx" button generates a file (The "Finish Line").

### 2. Media Assets
- [ ] **Demo Video (3 mins max):**
    -   *Hook:* "Writing a book is hard. Tools are either too simple (Docs) or too complex (Scrivener)."
    -   *Solution:* "DraftProse combines structure with AI intelligence."
    -   *Feature 1:* Show the **Binder** & **Corkboard** (Planning).
    -   *Feature 2:* Show **Muse Chat** (Brainstorming/Drafting).
    -   *Feature 3:* Show **Compile** (Publishing).
    -   *Tech Shoutout:* "Built with Gemini 3 Pro via Antigravity."
- [ ] **Screenshots:**
    -   Dashboard (Binder + Editor)
    -   Corkboard View (Visuals)
    -   Muse Chat (AI in action)
    -   Compile Dialog (The export power)
    -   Focus Mode (Zen)

### 3. Repository
- [ ] Update `README.md` with:
    -   Clear setup instructions (`npm install && npm run dev`).
    -   Environment variable requirements (`GOOGLE_API_KEY`).
    -   Badges: "Built with Gemini 3".

---

## 📝 Devpost Questions (Drafts)

### Project Description
**DraftProse** is an AI-native writing studio designed specifically for long-form content (novels, theses, screenplays). While standard editors treat text as a linear stream, DraftProse treats it as a structured project. It combines the organizational power of industry standards like Scrivener with the generative intelligence of Google's Gemini models.

Key features include:
*   **Binder:** A drag-and-drop tree for organizing chapters and scenes.
*   **Corkboard:** A spatial view to visualize and rearrange the narrative structure.
*   **Muse:** An integrated AI writing partner that understands your entire project context.
*   **Focus Mode:** A distraction-free interface for deep work.
*   **Compiler:** A powerful export engine to turn the project into a formatted manuscript.

### How we built it
The entire application was architected and coded using **Antigravity**, an advanced agentic coding assistant powered by **Gemini 3 Pro**.

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI for a premium component library.
*   **State Management:** Zustand for complex client-side project state (Binder/Corkboard sync).
*   **Drag & Drop:** `@dnd-kit` for the intricate nesting logic in the Binder and Corkboard.
*   **AI Integration:** **Gemini 3 Flash** is integrated directly into the "Muse" chat interface. We chose Flash for its exceptional speed and 1M token context window, allowing it to hold the entire manuscript in context for continuity checks without latency.

### Challenges we ran into
*   **Complex State Management:** Syncing a recursive tree structure (Binder) with a flat spatial view (Corkboard) and handling drag-and-drop operations between them was technically demanding.
*   **Recursive File Exports:** Building a "Compiler" that can flatten a nested tree of documents into a linear, formatted DOCX/PDF required implementing a custom traversal engine (`CompileEngine.ts`).

### Accomplishments that we're proud of
*   **Antigravity Workflow:** We built a complex, full-stack application significantly faster by pair-programming with Gemini 3 Pro agentically.
*   **The Compiler:** Successfully building a client-side export engine that handles formatting and file generation.
*   **Visual Polish:** The app feels incredibly smooth, with "Typewriter Scrolling" and glassmorphism UI elements that rival native desktop apps.

### What we learned
*   **Agentic Coding:** Leveraging a high-reasoning model like Gemini 3 Pro allows for architectural-level discussions, not just code completion.
*   **Context is King:** For AI writing assistants, passing the *right* context (character notes, previous chapters) is more important than the prompt itself.

### What's next for DraftProse
*   **Cloud Sync:** Moving from local browser persistence to a real-time collaborative cloud database.
*   **Multi-Modal Muse:** allowing users to upload sketches of maps or characters for Gemini to analyze.
*   **Marketplace:** Sharing and selling plot templates and character sheets.

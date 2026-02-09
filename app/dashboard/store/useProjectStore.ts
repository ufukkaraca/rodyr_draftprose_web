"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debounce } from '@/lib/utils';

// --- Types ---

export type NodeType = 'folder' | 'file';
export type NodeStatus = 'draft' | 'revised' | 'done' | 'outline' | 'note';
export type NodeLabel = 'chapter' | 'scene' | 'idea' | 'research' | 'character' | 'location';

const PROJECT_STORE_VERSION = '1.0.1-trash-debug';

export interface BinderNode {
  id: string;
  title: string;
  type: NodeType;
  parentId: string | null;
  order: number;
  status: NodeStatus;
  label: NodeLabel;
  synopsis: string;
  notes: string;
  collapsed?: boolean;
}

export interface Snapshot {
    id: string;
    date: string;
    content: string;
    label: string;
}

interface ProjectState {
  // Data State (Synced with Cloud)
  nodes: Record<string, BinderNode>;
  content: Record<string, string>;
  snapshots: Record<string, Snapshot[]>;
  projectId: string | null;
  
  // UI State (Persisted Locally)
  activeNodeId: string | null;
  viewMode: 'editor' | 'corkboard';
  focusMode: boolean;
  activeInspectorTab: string;
  
  // Split View State (DP-Editor)
  splitMode: 'none' | 'vertical' | 'horizontal';
  secondaryNodeId: string | null;
  activePane: 'primary' | 'secondary';

  // Async State
  isLoading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  setActiveNode: (id: string | null) => void;
  setViewMode: (mode: 'editor' | 'corkboard') => void;
  toggleFocusMode: () => void;
  setActiveInspectorTab: (tab: string) => void;
  
  setSplitMode: (mode: 'none' | 'vertical' | 'horizontal') => void;
  setSecondaryNodeId: (id: string | null) => void;
  setActivePane: (pane: 'primary' | 'secondary') => void;

  loadProject: (projectId: string) => Promise<void>;
  
  // CRUD Actions (Optimistic + API)
  addNode: (node: BinderNode, projectId: string) => Promise<void>;
  updateNode: (id: string, data: Partial<BinderNode>) => void;
  setContent: (id: string, content: string) => void;
  
  // High-level Actions
  moveNode: (id: string, newParentId: string | null, newIndex: number) => void;
  deleteNode: (id: string) => void;
  emptyTrash: () => Promise<void>;
  restoreNode: (id: string) => void;
  
  // Snapshot Actions
  addSnapshot: (nodeId: string, label: string) => Promise<void>;
  loadSnapshots: (nodeId: string) => Promise<void>;

  // Writing Targets (DP-6)
  targets: {
      projectGoal: number; // e.g. 50000
      sessionGoal: number; // e.g. 1000
      sessionDate: string; // ISO Date "YYYY-MM-DD" for reset
  };
  stats: {
      wordCount: number; // Total Project Words
      sessionCount: number; // Session Words
  };
  updateTargets: (targets: { projectGoal?: number; sessionGoal?: number }) => void;
  updateStats: (wordCount: number) => void; // Called by calculating total words
}

// Debounce map to track pending saves per document
const saveTimeouts: Record<string, NodeJS.Timeout> = {};

const triggerSave = (id: string, data: any) => {
    if (saveTimeouts[id]) clearTimeout(saveTimeouts[id]);
    
    // Set status to saving immediately? No, we do that in the action.
    // Here we just queue the API call.
    
    saveTimeouts[id] = setTimeout(async () => {
        try {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Save failed");
            
            useProjectStore.setState({ saveStatus: 'saved' });
            
            // Reset to idle after 2 seconds nicely
            setTimeout(() => useProjectStore.setState({ saveStatus: 'idle' }), 2000);
            
        } catch (error) {
            console.error("Auto-save failed", error);
            useProjectStore.setState({ saveStatus: 'error' });
        }
    }, 2000); // 2s debounce
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      nodes: {},
      content: {},
      snapshots: {},
      projectId: null as string | null, // Added
      activeNodeId: null,
      viewMode: 'editor',
      isLoading: true, // Start loading
      saveStatus: 'idle',

      // Targets Initial State
      targets: {
          projectGoal: 50000,
          sessionGoal: 1000,
          sessionDate: new Date().toISOString().split('T')[0]
      },
      stats: {
          wordCount: 0,
          sessionCount: 0
      },


      setViewMode: (mode) => set({ viewMode: mode }),
      
      focusMode: false,
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

      activeInspectorTab: 'synopsis',
      setActiveInspectorTab: (tab) => set({ activeInspectorTab: tab }),

      // Split View Implementation
      splitMode: 'none',
      secondaryNodeId: null,
      activePane: 'primary',
      
      setSplitMode: (mode) => set({ splitMode: mode }),
      setSecondaryNodeId: (id) => set({ secondaryNodeId: id }),
      setActivePane: (pane) => set({ activePane: pane }),

      // Modified setActiveNode to handle Split View context
      setActiveNode: (id) => set((state) => {
          if (state.splitMode !== 'none' && state.activePane === 'secondary') {
              return { secondaryNodeId: id };
          }
          return { activeNodeId: id };
      }),

      updateTargets: (newTargets) => set((state) => ({
          targets: { ...state.targets, ...newTargets }
      })),

      updateStats: (totalWords) => set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const isNewSession = state.targets.sessionDate !== today;
          
          let newSessionCount = state.stats.sessionCount;
          
          if (isNewSession) {
              // Reset session count if new day
              newSessionCount = 0;
          } else {
             const diff = totalWords - state.stats.wordCount;
             if (diff > 0) {
                 newSessionCount += diff;
             }
          }

          return {
              stats: {
                  wordCount: totalWords,
                  sessionCount: newSessionCount
              },
              targets: {
                  ...state.targets,
                  sessionDate: today
              }
          };
      }),

      loadProject: async (id) => {
          console.log(`[Store] Loading Project ${id} (v${PROJECT_STORE_VERSION})`);
          set({ isLoading: true, projectId: id }); // Set Project ID
          try {
              const res = await fetch(`/api/projects/${id}/tree`);
              if (!res.ok) throw new Error("Failed to load project");
              const docs = await res.json();
              
              const nodes: Record<string, BinderNode> = {};
              const content: Record<string, string> = {};
              
              docs.forEach((doc: any) => {
                  const metadata = doc.metadata || {};
                  nodes[doc.id] = {
                      id: doc.id,
                      title: doc.title,
                      type: doc.type as NodeType,
                      parentId: doc.parentId,
                      order: doc.order,
                      status: metadata.status || 'draft',
                      label: metadata.label || 'chapter',
                      synopsis: metadata.synopsis || '',
                      notes: metadata.notes || '',
                      collapsed: metadata.collapsed || false
                  };
                  content[doc.id] = doc.content || '';
              });
              
              // Ensure Research Folder Exists
              const researchId = `research-${id}`;
              if (!nodes[researchId]) {
                  const researchNode: BinderNode = {
                      id: researchId,
                      title: "Research",
                      type: "folder",
                      parentId: null,
                      order: 998,
                      status: "done",
                      label: "research",
                      synopsis: "Project research and reference materials.",
                      notes: "",
                      collapsed: false
                  };
                  nodes[researchId] = researchNode;
                  
                  // Persist to backend
                  fetch('/api/documents', {
                      method: 'POST',
                      body: JSON.stringify({ ...researchNode, projectId: id, metadata: {
                          system: 'research', label: 'research'
                      }})
                  }).catch(e => console.error("Failed to create Research folder", e));
              }

              set({ nodes, content, isLoading: false });
          } catch (error) {
              console.error(error);
              set({ isLoading: false });
          }
      },

      addNode: async (node, projectId) => {
           // Optimistic generic add
           set((state) => ({ nodes: { ...state.nodes, [node.id]: node } }));
           
           try {
               await fetch('/api/documents', {
                   method: 'POST',
                   body: JSON.stringify({ ...node, projectId, metadata: {
                       status: node.status, label: node.label, synopsis: node.synopsis, notes: node.notes
                   }})
               });
           } catch (e) {
               console.error("Failed to create node", e);
           }
      },

      updateNode: (id, data) => {
        set((state) => {
            const newNode = { ...state.nodes[id], ...data };
            return { 
                nodes: { ...state.nodes, [id]: newNode },
                saveStatus: 'saving'
            };
        });
        
        // Trigger Save
        const currentNode = get().nodes[id];
        triggerSave(id, { 
            title: currentNode.title,
            parentId: currentNode.parentId,
            order: currentNode.order,
            metadata: {
                status: currentNode.status,
                label: currentNode.label,
                synopsis: currentNode.synopsis,
                notes: currentNode.notes,
                collapsed: currentNode.collapsed
            }
        });
      },

      setContent: (id, newContent) => {
          set((state) => ({
              content: { ...state.content, [id]: newContent },
              saveStatus: 'saving'
          }));
          
          triggerSave(id, { content: newContent });
      },

      moveNode: (id, newParentId, newOrder) => {
          set((state) => {
              const node = state.nodes[id];
              if (!node) return {};
              return {
                  nodes: {
                      ...state.nodes,
                      [id]: { ...node, parentId: newParentId, order: newOrder }
                  },
                  saveStatus: 'saving'
              };
          });
          
           triggerSave(id, { parentId: newParentId, order: newOrder });
      },

      addSnapshot: async (nodeId, label) => {
          const currentContent = get().content[nodeId] || "";
          
          // Optimistic Update
          const tempId = Date.now().toString();
          const newSnap: Snapshot = {
              id: tempId,
              date: new Date().toISOString(), // ISO for sorting
              content: currentContent,
              label
          };

          set((state) => {
             const existing = state.snapshots[nodeId] || [];
             return {
                 snapshots: { ...state.snapshots, [nodeId]: [newSnap, ...existing] }
             };
          });

          try {
              const res = await fetch(`/api/documents/${nodeId}/snapshots`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ label, content: currentContent })
              });
              
              if (!res.ok) throw new Error("Failed to save snapshot");
              
              const savedSnap = await res.json();
              
              // Replace optimistic with real
              set((state) => {
                  const existing = state.snapshots[nodeId] || [];
                  const updated = existing.map(s => s.id === tempId ? {
                      ...savedSnap, 
                      date: savedSnap.createdAt // Map backend createdAt to frontend date
                  } : s);
                  return { snapshots: { ...state.snapshots, [nodeId]: updated } };
              });
              
          } catch (error) {
              console.error("Failed to create snapshot", error);
              // Revert optimistic? Or show error status? For now log.
          }
      },

      loadSnapshots: async (nodeId) => {
          try {
              const res = await fetch(`/api/documents/${nodeId}/snapshots`);
              if (!res.ok) throw new Error("Failed to load snapshots");
              const snaps = await res.json();
              
              const formattedSnaps = snaps.map((s: any) => ({
                  id: s.id,
                  label: s.label,
                  content: s.content || "",
                  date: s.createdAt
              }));

              set((state) => ({
                  snapshots: { ...state.snapshots, [nodeId]: formattedSnaps }
              }));
          } catch (e) {
              console.error("Load snapshots error", e);
          }
      },
      
      deleteNode: async (id) => {
          const state = get();
          const node = state.nodes[id];
          if (!node) return;

          // Determine Trash ID
          // Robustly find the trash folder in existing nodes
          const trashNode = Object.values(state.nodes).find(n => n.id === 'trash' || n.id === `trash-${state.projectId}` || (n as any).metadata?.system === 'trash');
          const trashId = trashNode ? trashNode.id : `trash-${state.projectId}`;

          console.log('[Store] deleteNode', { id, trashId, nodeParent: node.parentId });

          const isLegacyTrash = id === 'trash';
          const isScopedTrash = id === `trash-${state.projectId}`;
          const isResearch = id === `research-${state.projectId}`;
          
          // 1. If it's the Trash or Research folder, deny
          if (isLegacyTrash || isScopedTrash || isResearch || (node as any).metadata?.system === 'trash') return;

          // 2. Check if already in trash
          // Simplified: If parentId looks like trash, treat as trash for deletion purposes
          const isTrash = node.parentId && (node.parentId === 'trash' || node.parentId.startsWith('trash-'));
          
          console.log('[Store] isTrash?', isTrash);

          if (isTrash) {
              console.log('[Store] Hard Deleting', id);
              // Hard Delete
              set((state) => {
                  const { [id]: deleted, ...remaining } = state.nodes;
                  return { nodes: remaining };
              });
              await fetch(`/api/documents/${id}`, { method: 'DELETE' });
          } else {
              console.log('[Store] Soft Deleting (Moving to Trash)', id);
              // Soft Delete (Move to Trash)
              // We move to the resolved trashId
              set((state) => {
                 return {
                     nodes: {
                         ...state.nodes,
                         [id]: { ...node, parentId: trashId }
                     },
                     saveStatus: 'saving'
                 };
              });
              triggerSave(id, { parentId: trashId });
          }
      },
      
      emptyTrash: async () => {
          const state = get();
          
          // Find the trash node ID
          const trashNode = Object.values(state.nodes).find(n => n.id === 'trash' || n.id === `trash-${state.projectId}` || (n as any).metadata?.system === 'trash');
          const trashId = trashNode ? trashNode.id : `trash-${state.projectId}`;

          console.log('[Store] emptyTrash', { trashId });

          // Find children of THIS trash folder
          const trashChildren = Object.values(state.nodes).filter(n => n.parentId === trashId);
          
          console.log('[Store] trashChildren count', trashChildren.length);

          // Optimistic
          set((state) => {
              const newNodes = { ...state.nodes };
              trashChildren.forEach(child => {
                  delete newNodes[child.id];
              });
              return { nodes: newNodes };
          });
          
          // API
          for (const child of trashChildren) {
               await fetch(`/api/documents/${child.id}`, { method: 'DELETE' });
          }
      },

      restoreNode: async (id) => {
        const node = get().nodes[id];
        if (!node) return;
        
        // Restore to root (null), top order (0)
        set((state) => {
            return {
                nodes: {
                    ...state.nodes,
                    [id]: { ...node, parentId: null, order: 0 } 
                },
                saveStatus: 'saving'
            };
        });
        // We reuse logic similar to moveNode/triggerSave
        triggerSave(id, { parentId: null, order: 0 });
      }

    }),
    {
      name: 'draftprose-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
          activeNodeId: state.activeNodeId, 
          viewMode: state.viewMode,
          focusMode: state.focusMode,
          activeInspectorTab: state.activeInspectorTab
      }),
    }
  )
);


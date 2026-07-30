"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Clock, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotesByApplication,
  createRecruiterNote,
  updateRecruiterNote,
  deleteRecruiterNote,
  RecruiterNote,
} from "@/lib/queries/recruiter-notes";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface RecruiterNotesProps {
  applicationId: string;
  recruiterId: string;
  recruiterEmail?: string;
}

export default function RecruiterNotes({
  applicationId,
  recruiterId,
  recruiterEmail,
}: RecruiterNotesProps) {
  const supabase = createClient();
  const [notes, setNotes] = useState<RecruiterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadNotes() {
      const data = await getNotesByApplication(supabase, applicationId);
      setNotes(data);
      setLoading(false);
    }
    loadNotes();
  }, [applicationId, supabase]);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setIsAdding(true);
    const added = await createRecruiterNote(
      supabase,
      applicationId,
      recruiterId,
      newNote
    );
    setIsAdding(false);
    if (added) {
      setNotes([added, ...notes]);
      setNewNote("");
      toast.success("Note added successfully");
    } else {
      toast.error("Failed to add note");
    }
  }

  async function handleUpdateNote(id: string) {
    if (!editContent.trim()) return;
    const { error } = await updateRecruiterNote(supabase, id, editContent);
    if (error) {
      toast.error(`Failed to update note: ${error}`);
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, content: editContent, updated_at: new Date().toISOString() } : n
        )
      );
      setEditingId(null);
      toast.success("Note updated");
    }
  }

  async function handleDeleteNote(id: string) {
    const { error } = await deleteRecruiterNote(supabase, id);
    if (error) {
      toast.error(`Failed to delete note: ${error}`);
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    }
  }

  function startEdit(note: RecruiterNote) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Add Note Input */}
      <div className="rounded-2xl border border-border bg-slate-50/50 p-4 shadow-subtle focus-within:border-teal/50 focus-within:ring-1 focus-within:ring-teal/50 transition-all">
        <textarea
          ref={textareaRef}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note about this candidate..."
          className="w-full min-h-[80px] bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <span className="text-[10px] font-mono text-text-muted uppercase">
            Visible only to your team
          </span>
          <Button
            size="sm"
            variant="gradient"
            onClick={handleAddNote}
            isLoading={isAdding}
            disabled={!newNote.trim() || isAdding}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Save Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-8 text-center">
            <p className="text-xs text-text-muted">No internal notes yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-2xl border border-border bg-white p-4 shadow-subtle hover:shadow-hover transition-all"
              >
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-teal/30 bg-teal-light/20 p-3 text-sm text-text-primary focus:outline-none focus:border-teal resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-text-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-teal-dark bg-teal-light px-2 py-0.5 rounded-md">
                          {recruiterEmail?.split("@")[0] || "Recruiter"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(note.updated_at)}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => startEdit(note)}
                          className="rounded p-1 text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this note?")) {
                              handleDeleteNote(note.id);
                            }
                          }}
                          className="rounded p-1 text-text-secondary hover:bg-red-50 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

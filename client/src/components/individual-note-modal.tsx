import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Container } from "@shared/schema";

interface IndividualNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (containerId: number, group: 'carrier' | 'medlog', note: string) => void;
  container: Container | null;
  noteType: 'carrier' | 'medlog';
  userGroup: 'carrier' | 'medlog';
}

export default function IndividualNoteModal({ 
  isOpen, 
  onClose, 
  onSave, 
  container, 
  noteType, 
  userGroup 
}: IndividualNoteModalProps) {
  const [note, setNote] = useState("");

  // Load existing note when modal opens
  useEffect(() => {
    if (container && isOpen) {
      const existingNote = noteType === 'medlog' ? container.medlogNote : container.carrierNote;
      setNote(existingNote || "");
    }
  }, [container, noteType, isOpen]);

  const handleSave = () => {
    if (container) {
      onSave(container.id, noteType, note);
      onClose();
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  const canEdit = userGroup === noteType;
  const noteTypeName = noteType === 'medlog' ? 'Medlog' : 'Carrier';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg w-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? 'Edit' : 'View'} {noteTypeName} Note - {container?.containerIlu}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              {noteTypeName} Note
            </Label>
            <Textarea
              id="note"
              placeholder={canEdit ? `Enter ${noteType} note...` : "No note available"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              disabled={!canEdit}
              className={!canEdit ? "bg-gray-50" : ""}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {canEdit ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && (
              <Button onClick={handleSave}>
                Save Note
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
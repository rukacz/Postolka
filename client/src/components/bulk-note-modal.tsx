import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BulkNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  selectedCount: number;
}

const BulkNoteModal = ({ isOpen, onClose, onSave, selectedCount }: BulkNoteModalProps) => {
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave(note);
    setNote("");
    onClose();
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Add Note to Selected</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter note for selected containers..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!note.trim()}>
              Apply to {selectedCount}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkNoteModal;
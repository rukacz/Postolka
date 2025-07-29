import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BulkNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteType: 'carrier' | 'medlog', note: string) => void;
  selectedCount: number;
  userGroup: 'carrier' | 'medlog';
}

export default function BulkNoteModal({ isOpen, onClose, onSave, selectedCount, userGroup }: BulkNoteModalProps) {
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (note.trim()) {
      onSave(userGroup, note);
      setNote("");
      onClose();
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg w-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add {userGroup === 'carrier' ? 'Carrier' : 'Medlog'} Note to {selectedCount} Selected Container(s)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              {userGroup === 'carrier' ? 'Carrier Note' : 'Medlog Note'}
            </Label>
            <Textarea
              id="note"
              placeholder={`Enter note for ${userGroup}...`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Add Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
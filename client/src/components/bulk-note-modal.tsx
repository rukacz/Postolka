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
}

export default function BulkNoteModal({ isOpen, onClose, onSave, selectedCount }: BulkNoteModalProps) {
  const [carrierNote, setCarrierNote] = useState("");
  const [medlogNote, setMedlogNote] = useState("");

  const handleSave = (noteType: 'carrier' | 'medlog') => {
    const note = noteType === 'carrier' ? carrierNote : medlogNote;
    if (note.trim()) {
      onSave(noteType, note);
      if (noteType === 'carrier') {
        setCarrierNote("");
      } else {
        setMedlogNote("");
      }
      onClose();
    }
  };

  const handleClose = () => {
    setCarrierNote("");
    setMedlogNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note to {selectedCount} Selected Container(s)</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="carrier" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="carrier">Carrier Note</TabsTrigger>
            <TabsTrigger value="medlog">Medlog Note</TabsTrigger>
          </TabsList>
          <TabsContent value="carrier" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carrier-note">Carrier Note</Label>
              <Textarea
                id="carrier-note"
                placeholder="Enter note for carrier..."
                value={carrierNote}
                onChange={(e) => setCarrierNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('carrier')}>
                Add Carrier Note
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="medlog" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medlog-note">Medlog Note</Label>
              <Textarea
                id="medlog-note"
                placeholder="Enter note for medlog..."
                value={medlogNote}
                onChange={(e) => setMedlogNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('medlog')}>
                Add Medlog Note
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
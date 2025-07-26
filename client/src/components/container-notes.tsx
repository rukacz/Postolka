import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserGroup } from "@/lib/types";

interface ContainerNotesProps {
  carrierNote?: string;
  medlogNote?: string;
  onCarrierNoteChange: (note: string) => void;
  onMedlogNoteChange: (note: string) => void;
  userGroup: UserGroup;
}

const ContainerNotes = ({
  carrierNote = "",
  medlogNote = "",
  onCarrierNoteChange,
  onMedlogNoteChange,
  userGroup,
}: ContainerNotesProps) => {
  const [fullNoteDialog, setFullNoteDialog] = useState<{ type: 'carrier' | 'medlog'; note: string } | null>(null);
  
  const isCarrier = userGroup === 'carrier';
  const isMedlog = userGroup === 'medlog';

  const isLong = (text: string) => text.length > 80 || text.includes('\n');
  
  const handleFullNoteClick = (type: 'carrier' | 'medlog', note: string) => {
    setFullNoteDialog({ type, note });
  };

  return (
    <>
      <div className="flex gap-4 items-start pl-8 pt-1 pb-2">
        {/* Carrier Note */}
        <div className="flex items-center w-1/2 gap-2">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Carrier:</label>
          <div className="relative flex-1">
            <Input
              type="text"
              className={`text-sm ${
                !isCarrier ? "bg-gray-100 text-gray-600" : ""
              }`}
              value={carrierNote}
              onChange={(e) => onCarrierNoteChange(e.target.value)}
              readOnly={!isCarrier}
              placeholder="Note"
            />
            {isLong(carrierNote) && (
              <span
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 cursor-pointer hover:text-red-700"
                title="Note is longer than one line - click to view full note"
                onClick={() => handleFullNoteClick('carrier', carrierNote)}
              >
                ↘️
              </span>
            )}
          </div>
        </div>

        {/* Medlog Note */}
        <div className="flex items-center w-1/2 gap-2">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Medlog:</label>
          <div className="relative flex-1">
            <Input
              type="text"
              className={`text-sm ${
                !isMedlog ? "bg-gray-100 text-gray-600" : ""
              }`}
              value={medlogNote}
              onChange={(e) => onMedlogNoteChange(e.target.value)}
              readOnly={!isMedlog}
              placeholder="Note"
            />
            {isLong(medlogNote) && (
              <span
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 cursor-pointer hover:text-red-700"
                title="Note is longer than one line - click to view full note"
                onClick={() => handleFullNoteClick('medlog', medlogNote)}
              >
                ↘️
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full Note Dialog */}
      <Dialog open={!!fullNoteDialog} onOpenChange={() => setFullNoteDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fullNoteDialog?.type === 'carrier' ? 'Carrier' : 'Medlog'} Note - Full View
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={fullNoteDialog?.note || ''}
              readOnly
              className="min-h-[120px] resize-none"
            />
            <Button onClick={() => setFullNoteDialog(null)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContainerNotes;
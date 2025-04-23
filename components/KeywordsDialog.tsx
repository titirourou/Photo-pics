import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KeywordsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keywords: string[]) => void;
  folderName: string;
}

export default function KeywordsDialog({ isOpen, onClose, onSubmit, folderName }: KeywordsDialogProps) {
  const [keywords, setKeywords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    onSubmit(keywordArray);
    setKeywords('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Keywords to {folderName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="Enter keywords (comma-separated)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Keywords</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
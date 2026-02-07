import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '../store/useProjectStore';
import { Target, Trophy } from 'lucide-react';

interface TargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TargetDialog({ open, onOpenChange }: TargetDialogProps) {
  const { targets, updateTargets } = useProjectStore();
  const [projectGoal, setProjectGoal] = React.useState(targets.projectGoal);
  const [sessionGoal, setSessionGoal] = React.useState(targets.sessionGoal);

  // Sync with store when opening
  React.useEffect(() => {
    if (open) {
      setProjectGoal(targets.projectGoal);
      setSessionGoal(targets.sessionGoal);
    }
  }, [open, targets]);

  const handleSave = () => {
    updateTargets({ projectGoal, sessionGoal });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Writing Goals
          </DialogTitle>
          <DialogDescription>
            Set your targets to stay motivated.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-goal">Project Target (Words)</Label>
            <div className="relative">
              <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="project-goal"
                type="number"
                value={projectGoal}
                onChange={(e) => setProjectGoal(Number(e.target.value))}
                className="pl-9"
              />
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Total word count goal for the entire manuscript.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-goal">Daily Session Target (Words)</Label>
            <div className="relative">
              <Trophy className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="session-goal"
                type="number"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(Number(e.target.value))}
                className="pl-9"
              />
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Daily word count target. Resets every day.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Goals</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

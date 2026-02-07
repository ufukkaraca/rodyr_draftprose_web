import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Target, Flame } from 'lucide-react';

interface TargetProgressProps {
  onClick?: () => void;
  className?: string;
}

export function TargetProgress({ onClick, className }: TargetProgressProps) {
  const { targets, stats } = useProjectStore();
  
  // Calculate Progress
  const sessionPercent = Math.min(100, Math.round((stats.sessionCount / targets.sessionGoal) * 100));
  const projectPercent = Math.min(100, Math.round((stats.wordCount / targets.projectGoal) * 100));

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-3 py-1.5 bg-background/50 backdrop-blur-sm border border-border/20 rounded-md cursor-pointer hover:bg-muted/50 transition-colors group select-none", 
        className
      )}
    >
      {/* Session Goal (Mini Ring or Bar) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1 w-24">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground leading-none">
                <span className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Session
                </span>
                <span className={cn(
                    "font-mono font-medium",
                    sessionPercent >= 100 ? "text-green-500" : ""
                )}>
                  {stats.sessionCount} / {targets.sessionGoal}
                </span>
              </div>
              <Progress value={sessionPercent} className="h-1" indicatorClassName={sessionPercent >= 100 ? "bg-green-500" : "bg-orange-500"} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Daily Target: {sessionPercent}%
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Vertical Separator */}
      <div className="h-6 w-px bg-border/50" />

      {/* Project Goal */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1 w-24">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground leading-none">
                 <span className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                  <Target className="h-3 w-3 text-blue-500" />
                  Project
                </span>
                <span className="font-mono font-medium">
                  {projectPercent}%
                </span>
              </div>
              <Progress value={projectPercent} className="h-1" indicatorClassName="bg-blue-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Total: {stats.wordCount.toLocaleString()} / {targets.projectGoal.toLocaleString()} words
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

import { useListDailyQuests, useCompleteDailyQuest, getListDailyQuestsQueryKey, getGetCharacterQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function DailyQuests() {
  const { data: quests, isLoading } = useListDailyQuests();
  const completeQuest = useCompleteDailyQuest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleComplete = (id: number) => {
    completeQuest.mutate({ id }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListDailyQuestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey() });
        toast({ title: "Daily Quest Complete!", description: `+${data.xp_gained} XP` });
      }
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'medium': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'hard': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-2">
          <Calendar className="w-8 h-8 text-secondary" />
          Daily Quests
        </h1>
        <p className="text-muted-foreground">Complete these every day to maintain your streak.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading dailies...</div>
        ) : quests?.map((quest, idx) => (
          <Card key={quest.id} className={`group transition-all duration-300 ${quest.completed ? 'opacity-50' : 'hover:border-secondary/50'} animate-in fade-in slide-in-from-left-4`} style={{ animationDelay: `${idx * 100}ms` }}>
            <CardContent className="p-5 flex items-center gap-4">
              <button 
                onClick={() => !quest.completed && handleComplete(quest.id)}
                disabled={quest.completed || completeQuest.isPending}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  quest.completed 
                    ? "bg-secondary border-secondary text-secondary-foreground" 
                    : "border-muted-foreground hover:border-secondary text-transparent hover:text-secondary/50"
                }`}
              >
                <Check className="w-6 h-6" />
              </button>
              
              <div className="text-3xl hidden sm:block">{quest.icon}</div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-lg ${quest.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {quest.title}
                </h3>
                {quest.description && <p className="text-sm text-muted-foreground truncate">{quest.description}</p>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-primary">+{quest.xp_reward} XP</span>
                <Badge variant="outline" className={`${getDifficultyColor(quest.difficulty)} uppercase text-[10px]`}>
                  {quest.difficulty}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

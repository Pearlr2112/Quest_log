import { useState } from "react";
import { useListTasks, useCreateTask, useCompleteTask, useDeleteTask, getListTasksQueryKey, getGetCharacterQueryKey, getGetCharacterStatsQueryKey, TaskPriority, TaskInputPriority } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Trash2, Plus, Sword } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function QuestLog() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskInputPriority>("low");
  const [levelUpData, setLevelUpData] = useState<{show: boolean, level: number | null}>({ show: false, level: null });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useListTasks();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const filteredTasks = tasks?.filter(t => {
    if (filter === "active" && t.completed) return false;
    if (filter === "completed" && !t.completed) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateTask = () => {
    if (!newTaskTitle) return;
    createTask.mutate({ data: { title: newTaskTitle, priority: newTaskPriority } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setNewTaskTitle("");
        setIsCreating(false);
      }
    });
  };

  const handleComplete = (id: number) => {
    completeTask.mutate({ id }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterStatsQueryKey() });
        
        toast({
          title: "Quest Completed!",
          description: `Gained +${data.xp_gained} XP`,
          className: "bg-primary text-primary-foreground border-primary",
        });

        if (data.leveled_up) {
          setLevelUpData({ show: true, level: data.new_level ?? null });
        }
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'legendary': return "bg-amber-500/20 text-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
      case 'high': return "bg-destructive/20 text-destructive border-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      case 'medium': return "bg-secondary/20 text-secondary border-secondary";
      case 'low': return "bg-muted text-muted-foreground border-muted-foreground/30";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-2">
            <Sword className="w-8 h-8 text-primary" />
            Quest Log
          </h1>
          <p className="text-muted-foreground">Manage your adventures</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          <Plus className="w-4 h-4" /> New Quest
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quests</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCreating && (
        <Card className="border-primary/50 bg-card/80 backdrop-blur">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <Input 
              placeholder="Quest Title..." 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Select value={newTaskPriority} onValueChange={(v: TaskInputPriority) => setNewTaskPriority(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle || createTask.isPending}>Add</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading quests...</div>
        ) : filteredTasks?.length === 0 ? (
          <div className="text-center py-12 bg-card/30 rounded-lg border border-border border-dashed">
            <h3 className="text-lg font-medium text-muted-foreground">Your quest log is empty.</h3>
            <p className="text-sm text-muted-foreground/70">Time to find a new adventure!</p>
          </div>
        ) : (
          filteredTasks?.map((task, idx) => (
            <Card key={task.id} className={`group border-border transition-all duration-300 hover:border-primary/50 animate-in fade-in slide-in-from-right-4`} style={{ animationDelay: `${idx * 50}ms` }}>
              <CardContent className="p-4 flex items-center gap-4">
                <button 
                  onClick={() => !task.completed && handleComplete(task.id)}
                  disabled={task.completed || completeTask.isPending}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground hover:border-primary text-transparent hover:text-primary/50"
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </h3>
                  {task.stat_bonus_type && (
                    <p className="text-xs text-secondary mt-1">
                      +{task.stat_bonus_value} {task.stat_bonus_type.toUpperCase()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">+{task.xp_reward} XP</span>
                  <Badge variant="outline" className={`${getPriorityColor(task.priority)} uppercase tracking-wider text-[10px]`}>
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/20" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={levelUpData.show} onOpenChange={(v) => setLevelUpData(prev => ({...prev, show: v}))}>
        <DialogContent className="sm:max-w-md text-center bg-card border-primary/50 shadow-[0_0_50px_rgba(255,190,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-4xl text-primary font-serif mb-2">LEVEL UP!</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary text-5xl animate-bounce">
              ⭐
            </div>
            <p className="text-2xl font-bold text-foreground">You reached Level {levelUpData.level}!</p>
            <p className="text-muted-foreground">Your power grows stronger.</p>
          </div>
          <Button onClick={() => setLevelUpData({show: false, level: null})} className="w-full text-lg">Continue Journey</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

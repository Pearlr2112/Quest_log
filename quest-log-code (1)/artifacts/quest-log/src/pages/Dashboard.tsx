import { useGetCharacter, useListTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: character } = useGetCharacter();
  const { data: tasks } = useListTasks();

  if (!character) return null;

  const xpProgress = character.xp_to_next_level > 0 
    ? (character.xp / character.xp_to_next_level) * 100 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-4xl font-bold font-serif text-foreground">Welcome back, <span className="text-primary">{character.name}</span></h1>
        <p className="text-muted-foreground mt-2 text-lg">Your next quest awaits. What will you conquer today?</p>
      </header>

      <Card className="bg-card border-primary/20 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full border-2 border-primary bg-background flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(255,190,0,0.3)]">
              {character.avatar_emoji || "👤"}
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Level {character.level} {character.class_name}</h2>
                  <p className="text-sm text-muted-foreground">{character.xp} / {character.xp_to_next_level} XP</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                  Streak: {character.streak_days} Days 🔥
                </Badge>
              </div>
              <div className="relative h-4 w-full bg-background rounded-full overflow-hidden border border-border">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,190,0,0.8)]"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">Recent Quests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks?.slice(0, 5).map(task => (
              <div key={task.id} className="p-4 rounded-lg bg-background border border-border flex items-center justify-between hover:border-primary/50 transition-colors">
                <div className="flex flex-col">
                  <span className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</span>
                  <span className="text-xs text-muted-foreground">+{task.xp_reward} XP</span>
                </div>
                {task.priority === 'legendary' && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500">Legendary</Badge>}
                {task.priority === 'high' && <Badge className="bg-destructive/20 text-destructive border-destructive">High</Badge>}
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">Your adventure awaits. Add a quest!</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-xl">Stats Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">STR</span>
                <span className="text-2xl font-bold text-foreground">{character.strength}</span>
              </div>
              <div className="p-4 rounded-lg bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">END</span>
                <span className="text-2xl font-bold text-foreground">{character.endurance}</span>
              </div>
              <div className="p-4 rounded-lg bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">FOC</span>
                <span className="text-2xl font-bold text-foreground">{character.focus}</span>
              </div>
              <div className="p-4 rounded-lg bg-background border border-border flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">AGI</span>
                <span className="text-2xl font-bold text-foreground">{character.agility}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

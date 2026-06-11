import { useGetCharacter, useGetCharacterStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Target, Zap, Clover, Dumbbell } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function CharacterSheet() {
  const { data: character } = useGetCharacter();
  const { data: stats } = useGetCharacterStats();

  if (!character || !stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-2">
          <User className="w-8 h-8 text-primary" />
          Character Sheet
        </h1>
        <p className="text-muted-foreground">Your vital statistics and lifetime achievements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/20 bg-card/80 backdrop-blur">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-32 h-32 rounded-full border-4 border-primary bg-background flex items-center justify-center text-6xl shadow-[0_0_20px_rgba(255,190,0,0.4)]">
              {character.avatar_emoji || "👤"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{character.name}</h2>
              <p className="text-muted-foreground font-medium">Level {character.level} {character.class_name}</p>
            </div>
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP</span>
                <span>{character.xp} / {character.xp_to_next_level}</span>
              </div>
              <Progress value={(character.xp / character.xp_to_next_level) * 100} className="h-2 bg-background border border-border [&>div]:bg-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Core Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <StatBox icon={Dumbbell} label="Strength" value={character.strength} color="text-red-500" />
              <StatBox icon={Shield} label="Endurance" value={character.endurance} color="text-green-500" />
              <StatBox icon={Target} label="Focus" value={character.focus} color="text-blue-500" />
              <StatBox icon={Zap} label="Agility" value={character.agility} color="text-yellow-500" />
              <StatBox icon={Clover} label="Luck" value={character.luck} color="text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle>Lifetime Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Quests Completed</span>
              <span className="font-bold text-foreground">{stats.total_tasks_completed}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total XP Earned</span>
              <span className="font-bold text-primary">{stats.total_xp_earned}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Bosses Defeated</span>
              <span className="font-bold text-destructive">{stats.bosses_defeated}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Daily Quests Completed</span>
              <span className="font-bold text-secondary">{stats.daily_quests_completed}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Current Streak</span>
              <span className="font-bold text-orange-500">{stats.streak_days} Days 🔥</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EquipSlot label="Weapon" item={character.equipped_weapon} />
            <EquipSlot label="Outfit" item={character.equipped_outfit} />
            <EquipSlot label="Pet" item={character.equipped_pet} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex flex-col items-center p-4 bg-background border border-border rounded-lg">
      <Icon className={`w-8 h-8 ${color} mb-2`} />
      <span className="text-3xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EquipSlot({ label, item }: { label: string, item: string | null | undefined }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background">
      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xl">
        {item ? item.split(' ')[0] : '?'}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium text-foreground">{item || 'Empty Slot'}</p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useListBosses, useCreateBoss, useDamageBoss, getListBossesQueryKey, getGetCharacterQueryKey, BossInputDifficulty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, ShieldAlert, Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BossBattles() {
  const { data: bosses, isLoading } = useListBosses();
  const createBoss = useCreateBoss();
  const damageBoss = useDamageBoss();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiff, setNewDiff] = useState<BossInputDifficulty>("normal");

  const handleCreate = () => {
    if (!newTitle) return;
    createBoss.mutate({ data: { title: newTitle, description: newDesc, difficulty: newDiff } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBossesQueryKey() });
        setIsCreating(false);
        setNewTitle("");
        setNewDesc("");
      }
    });
  };

  const handleDamage = (id: number, amount: number) => {
    damageBoss.mutate({ id, data: { damage: amount } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBossesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey() });
        toast({ title: "Boss Damaged!", description: `Dealt ${amount} damage.` });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-2">
            <Flame className="w-8 h-8 text-destructive" />
            Boss Battles
          </h1>
          <p className="text-muted-foreground">Tackle your largest projects and long-term goals.</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Summon Boss</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Summon a new Boss</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Boss Name (e.g. Final Essay)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <Select value={newDiff} onValueChange={(v: BossInputDifficulty) => setNewDiff(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} disabled={!newTitle || createBoss.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Scouting for bosses...</div>
        ) : bosses?.length === 0 ? (
          <div className="text-center py-12 bg-card/30 rounded-lg border border-border border-dashed">
            <h3 className="text-lg font-medium text-muted-foreground">The realm is safe.</h3>
            <p className="text-sm text-muted-foreground/70">No active boss battles right now.</p>
          </div>
        ) : (
          bosses?.map((boss) => {
            const hpPercent = (boss.current_hp / boss.max_hp) * 100;
            return (
              <Card key={boss.id} className={`border-destructive/30 bg-card overflow-hidden relative ${boss.defeated ? 'opacity-50 grayscale' : ''}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldAlert className="w-32 h-32 text-destructive" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {boss.emoji || "🐲"} {boss.title}
                      </CardTitle>
                      {boss.description && <p className="text-muted-foreground mt-1">{boss.description}</p>}
                    </div>
                    <Badge variant="outline" className="border-destructive text-destructive">
                      {boss.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-destructive">HP</span>
                      <span className="text-foreground">{boss.current_hp} / {boss.max_hp}</span>
                    </div>
                    <div className="h-6 w-full bg-background rounded-sm overflow-hidden border border-border">
                      <div 
                        className="h-full bg-destructive transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {!boss.defeated && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                      <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={() => handleDamage(boss.id, 10)}>
                        <Swords className="w-4 h-4 mr-2" /> Small Strike (10 DMG)
                      </Button>
                      <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={() => handleDamage(boss.id, 25)}>
                        <Swords className="w-4 h-4 mr-2" /> Heavy Blow (25 DMG)
                      </Button>
                      <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={() => handleDamage(boss.id, 50)}>
                        <Flame className="w-4 h-4 mr-2" /> Limit Break (50 DMG)
                      </Button>
                    </div>
                  )}
                  {boss.defeated && (
                    <div className="text-center p-4 bg-primary/10 text-primary font-bold rounded-lg border border-primary/20">
                      BOSS DEFEATED! (+{boss.xp_reward} XP)
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useCreateCharacter, getGetCharacterQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const CLASSES = [
  { name: "Fairy",       emoji: "🧚", desc: "Agile & lucky",  color: "hsl(300 70% 65%)" },
  { name: "Enchantress", emoji: "🔮", desc: "High focus magic", color: "hsl(270 65% 60%)" },
  { name: "Princess",    emoji: "👑", desc: "Balanced & lucky", color: "hsl(330 75% 60%)" },
  { name: "Scholar",     emoji: "📚", desc: "Super focused",  color: "hsl(210 70% 58%)" },
  { name: "Witch",       emoji: "🧙‍♀️", desc: "Focus & speed",  color: "hsl(260 60% 58%)" },
  { name: "Healer",      emoji: "💊", desc: "Endurance first", color: "hsl(150 60% 48%)" },
];

export default function CharacterCreate() {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const createCharacter = useCreateCharacter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim()) return;
    createCharacter.mutate(
      { data: { name: name.trim(), class_name: selectedClass.name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey() });
          toast({
            title: `✨ Welcome, ${name}!`,
            description: `Your adventure as a ${selectedClass.name} begins now!`,
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(340 70% 96%) 0%, hsl(270 55% 95%) 50%, hsl(330 60% 96%) 100%)" }}>

      {/* Floating sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["10%,15%", "85%,20%", "20%,75%", "75%,80%", "50%,10%", "60%,60%"].map((pos, i) => (
          <div key={i} className="absolute text-2xl animate-pulse"
            style={{ left: pos.split(",")[0], top: pos.split(",")[1], animationDelay: `${i * 0.4}s`, opacity: 0.25 }}>
            ✨
          </div>
        ))}
      </div>

      <Card className="max-w-md w-full shadow-2xl border-0 rounded-3xl overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>

        {/* Pink gradient top stripe */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, hsl(330 75% 60%), hsl(270 55% 65%), hsl(300 65% 65%))" }} />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="text-5xl mb-2">{selectedClass.emoji}</div>
          <CardTitle className="text-3xl font-black" style={{ color: "hsl(330 75% 55%)" }}>
            Create Your Hero
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Every great adventure starts with a name 🌸
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8 px-6">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/70">Your Name</label>
            <Input
              placeholder="e.g. Luna, Stella, Rose..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="rounded-2xl border-2 font-semibold h-12 text-base focus-visible:ring-0"
              style={{ borderColor: "hsl(330 50% 85%)", background: "hsl(330 60% 98%)" }}
              data-testid="input-hero-name"
            />
          </div>

          {/* Class selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground/70">Choose Your Class</label>
            <div className="grid grid-cols-2 gap-2">
              {CLASSES.map((cls) => (
                <button
                  key={cls.name}
                  onClick={() => setSelectedClass(cls)}
                  data-testid={`button-class-${cls.name.toLowerCase()}`}
                  className="p-3 rounded-2xl border-2 text-left transition-all duration-200 group hover:scale-[1.02]"
                  style={{
                    borderColor: selectedClass.name === cls.name ? cls.color : "hsl(330 40% 88%)",
                    background: selectedClass.name === cls.name
                      ? `${cls.color}18`
                      : "hsl(0 0% 100%)",
                    boxShadow: selectedClass.name === cls.name ? `0 0 0 3px ${cls.color}30` : "none"
                  }}
                >
                  <div className="text-xl mb-1">{cls.emoji}</div>
                  <div className="font-bold text-xs" style={{ color: selectedClass.name === cls.name ? cls.color : "hsl(330 20% 40%)" }}>
                    {cls.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{cls.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createCharacter.isPending}
            data-testid="button-begin-adventure"
            className="w-full h-12 rounded-2xl text-base font-bold border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, hsl(330 75% 60%), hsl(270 55% 65%))", color: "white" }}
          >
            {createCharacter.isPending ? "Casting spell... ✨" : "Begin Adventure 🌸"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

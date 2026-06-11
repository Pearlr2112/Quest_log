import { useLocation } from "wouter";
import { Sparkles, BookHeart, Wand2, CalendarHeart, UserRound, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useGetCharacter } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: character } = useGetCharacter();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Sparkles },
    { href: "/quests", label: "Quest Log", icon: BookHeart },
    { href: "/boss", label: "Boss Battles", icon: Wand2 },
    { href: "/daily", label: "Daily Quests", icon: CalendarHeart },
    { href: "/character", label: "Character", icon: UserRound },
    { href: "/inventory", label: "Wardrobe", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Cute background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle, hsl(330 75% 58%) 1px, transparent 1px)",
        backgroundSize: "28px 28px"
      }} />

      <aside className="w-64 border-r border-border flex-shrink-0 hidden md:flex flex-col"
        style={{ background: "linear-gradient(180deg, hsl(340 70% 98%) 0%, hsl(270 50% 97%) 100%)" }}>

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-black text-primary flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            Quest Log
            <span className="text-lg">✨</span>
          </h1>

          {character && (
            <div className="mt-4 flex items-center gap-3 bg-white/70 rounded-2xl p-3 border border-border shadow-sm">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ background: "linear-gradient(135deg, hsl(330 80% 85%), hsl(270 60% 80%))" }}>
                {character.avatar_emoji || "🧚"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{character.name}</p>
                <p className="text-xs text-muted-foreground">Lv.{character.level} {character.class_name}</p>
                {/* Mini XP bar */}
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-24">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (character.xp / character.xp_to_next_level) * 100)}%`,
                      background: "linear-gradient(90deg, hsl(330 75% 65%), hsl(270 60% 65%))"
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm ${
                  isActive
                    ? "text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-white/60 hover:text-primary"
                }`}
                style={isActive ? {
                  background: "linear-gradient(135deg, hsl(330 75% 60%), hsl(270 55% 65%))"
                } : {}}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto text-xs opacity-80">✦</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom sparkle decoration */}
        <div className="p-4 text-center text-xs text-muted-foreground/60 font-medium">
          ✨ keep going, you got this! ✨
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

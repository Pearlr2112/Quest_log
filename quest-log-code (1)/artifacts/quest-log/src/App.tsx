import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetCharacter } from "@workspace/api-client-react";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CharacterCreate from "./pages/CharacterCreate";
import QuestLog from "./pages/QuestLog";
import BossBattles from "./pages/BossBattles";
import DailyQuests from "./pages/DailyQuests";
import CharacterSheet from "./pages/CharacterSheet";
import Inventory from "./pages/Inventory";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoutes() {
  const { data: character, isLoading } = useGetCharacter();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse">Loading Realm...</div>;
  }

  // Show character creation if no character exists yet for this user
  if (!character) {
    return <CharacterCreate />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/quests" component={QuestLog} />
        <Route path="/boss" component={BossBattles} />
        <Route path="/daily" component={DailyQuests} />
        <Route path="/character" component={CharacterSheet} />
        <Route path="/inventory" component={Inventory} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

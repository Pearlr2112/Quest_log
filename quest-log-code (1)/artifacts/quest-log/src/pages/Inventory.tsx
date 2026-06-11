import { useListInventory, useListShop, usePurchaseItem, getListInventoryQueryKey, getListShopQueryKey, getGetCharacterQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const { data: inventory } = useListInventory();
  const { data: shop } = useListShop();
  const purchaseItem = usePurchaseItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handlePurchase = (id: number) => {
    purchaseItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShopQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCharacterQueryKey() });
        toast({ title: "Item Purchased!", description: "Check your inventory to equip it." });
      },
      onError: (err: any) => {
        toast({ title: "Purchase Failed", description: err.message || "Not enough XP", variant: "destructive" });
      }
    });
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'text-amber-500 border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'epic': return 'text-purple-500 border-purple-500/50 bg-purple-500/10';
      case 'rare': return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
      default: return 'text-muted-foreground border-border bg-muted/50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          Inventory & Shop
        </h1>
        <p className="text-muted-foreground">Spend your hard-earned XP on new gear.</p>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border">
          <TabsTrigger value="shop" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Shop</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">My Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop?.map(item => (
              <Card key={item.id} className={`border border-border bg-card/80 backdrop-blur overflow-hidden flex flex-col ${item.unlocked ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className={`${getRarityColor(item.rarity)} uppercase text-[10px]`}>
                      {item.rarity}
                    </Badge>
                    <Badge variant="outline" className="bg-background">{item.item_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="text-4xl">{item.emoji}</div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border mt-4 p-4 bg-background/50">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-primary flex items-center gap-1">
                      ⭐ {item.xp_cost} XP
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(item.id)} 
                      disabled={item.unlocked || purchaseItem.isPending}
                    >
                      {item.unlocked ? "Owned" : "Purchase"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          {inventory?.length === 0 ? (
            <div className="text-center py-12 bg-card/30 rounded-lg border border-border border-dashed">
              <h3 className="text-lg font-medium text-muted-foreground">Your bags are empty.</h3>
              <p className="text-sm text-muted-foreground/70">Visit the shop to spend your XP!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory?.map(item => (
                <Card key={item.id} className="border border-border bg-card flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className={`${getRarityColor(item.rarity)} uppercase text-[10px]`}>
                        {item.rarity}
                      </Badge>
                      <Badge variant="outline" className="bg-background">{item.item_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="text-4xl">{item.emoji}</div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TreePine, Gift } from "lucide-react";

// We store Giving Tree items as InventoryItems with owner_id = "giving_tree"
const GIVING_TREE_OWNER = "giving_tree";

export default function GivingTree({ user }) {
  const [taking, setTaking] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: myItems = [] } = useQuery({
    queryKey: ["inventory", user?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: treeItems = [] } = useQuery({
    queryKey: ["givingTree"],
    queryFn: () => base44.entities.InventoryItem.filter({ owner_id: GIVING_TREE_OWNER }),
  });

  const takeItem = async (treeItem) => {
    setTaking(treeItem.id);
    // Remove from tree
    if (treeItem.quantity > 1) {
      await base44.entities.InventoryItem.update(treeItem.id, { quantity: treeItem.quantity - 1 });
    } else {
      await base44.entities.InventoryItem.delete(treeItem.id);
    }
    // Add to my inventory
    const existing = myItems.find(i => i.item_key === treeItem.item_key);
    if (existing) {
      await base44.entities.InventoryItem.update(existing.id, { quantity: existing.quantity + 1 });
    } else {
      await base44.entities.InventoryItem.create({
        owner_id: user.id,
        item_key: treeItem.item_key,
        item_name: treeItem.item_name,
        item_type: treeItem.item_type,
        quantity: 1,
        description: treeItem.description,
        icon: treeItem.icon,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["givingTree"] });
    queryClient.invalidateQueries({ queryKey: ["inventory", user?.id] });
    setTaking(null);
  };

  const leaveItem = async (myItem) => {
    setLeaving(myItem.id);
    if (myItem.quantity > 1) {
      await base44.entities.InventoryItem.update(myItem.id, { quantity: myItem.quantity - 1 });
    } else {
      await base44.entities.InventoryItem.delete(myItem.id);
    }
    const existing = treeItems.find(i => i.item_key === myItem.item_key);
    if (existing) {
      await base44.entities.InventoryItem.update(existing.id, { quantity: existing.quantity + 1 });
    } else {
      await base44.entities.InventoryItem.create({
        owner_id: GIVING_TREE_OWNER,
        item_key: myItem.item_key,
        item_name: myItem.item_name,
        item_type: myItem.item_type,
        quantity: 1,
        description: myItem.description,
        icon: myItem.icon,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["givingTree"] });
    queryClient.invalidateQueries({ queryKey: ["inventory", user?.id] });
    setLeaving(null);
  };

  return (
    <div className="space-y-4">
      {/* Tree items */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TreePine className="w-5 h-5 text-primary" /> The Giving Tree
          </CardTitle>
          <p className="text-xs text-muted-foreground font-body">Items left by other players for anyone to take.</p>
        </CardHeader>
        <CardContent>
          {treeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">The tree is bare. Be the first to leave something!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {treeItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg border border-border/60 bg-card space-y-2 text-center">
                  <p className="text-2xl">{item.icon}</p>
                  <p className="font-display text-xs font-semibold">{item.item_name}</p>
                  {item.quantity > 1 && <Badge variant="outline" className="text-[10px]">x{item.quantity}</Badge>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-display"
                    disabled={taking === item.id}
                    onClick={() => takeItem(item)}
                  >
                    {taking === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Take"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My items to leave */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" /> Leave an Item
          </CardTitle>
          <p className="text-xs text-muted-foreground font-body">Donate items from your inventory to the tree.</p>
        </CardHeader>
        <CardContent>
          {myItems.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Your inventory is empty.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg border border-border/60 bg-card space-y-2 text-center">
                  <p className="text-2xl">{item.icon}</p>
                  <p className="font-display text-xs font-semibold">{item.item_name}</p>
                  {item.quantity > 1 && <Badge variant="outline" className="text-[10px]">x{item.quantity}</Badge>}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs font-display"
                    disabled={leaving === item.id}
                    onClick={() => leaveItem(item)}
                  >
                    {leaving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Leave"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

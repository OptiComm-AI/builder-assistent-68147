import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as unknown as any;

interface BOM {
  id: string;
  total_estimated_cost: number | null;
}

interface BOMStatsProps {
  projectId: string;
  boms: BOM[];
}

const BOMStats = ({ projectId, boms }: BOMStatsProps) => {
  // Get total items across all BOMs
  const { data: itemsData } = useQuery({
    queryKey: ["bom-items-count", projectId],
    queryFn: async () => {
      const bomIds = boms.map(b => b.id);
      if (bomIds.length === 0) return { count: 0 };
      
      const { count, error } = await sb
        .from("bom_items")
        .select("*", { count: 'exact', head: true })
        .in("bom_id", bomIds);
      
      if (error) throw error;
      return { count: count || 0 };
    },
    enabled: boms.length > 0,
  });

  // Get shopping list items count
  const { data: shoppingData } = useQuery({
    queryKey: ["shopping-items-count", projectId],
    queryFn: async () => {
      const bomIds = boms.map(b => b.id);
      if (bomIds.length === 0) return { count: 0 };
      
      const { data: items, error } = await sb
        .from("product_matches")
        .select(`
          id,
          bom_items!inner (
            bom_id
          )
        `)
        .eq("is_selected", true)
        .in("bom_items.bom_id", bomIds);
      
      if (error) throw error;
      return { count: items?.length || 0 };
    },
    enabled: boms.length > 0,
  });

  const totalEstimatedCost = boms.reduce((sum, bom) => {
    return sum + (bom.total_estimated_cost || 0);
  }, 0);

  const stats = [
    {
      title: "Total BOMs",
      value: boms.length,
      icon: Package,
      description: "Bills of Materials created",
    },
    {
      title: "Total Items",
      value: itemsData?.count || 0,
      icon: TrendingUp,
      description: "Across all BOMs",
    },
    {
      title: "Estimated Cost",
      value: `$${totalEstimatedCost.toLocaleString()}`,
      icon: DollarSign,
      description: "Total project materials",
    },
    {
      title: "Shopping List",
      value: shoppingData?.count || 0,
      icon: ShoppingBag,
      description: "Products selected",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BOMStats;

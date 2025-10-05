import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShoppingListItem {
  id: string;
  product_name: string;
  product_url: string;
  price: number | null;
  vendor: string;
  bom_item: {
    item_name: string;
    quantity: number;
    unit: string | null;
  };
}

interface Props {
  bomId: string;
}

export const ShoppingList = ({ bomId }: Props) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchShoppingList();
  }, [bomId]);

  const fetchShoppingList = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('product_matches')
        .select(`
          id,
          product_name,
          product_url,
          price,
          vendor,
          bom_items!inner (
            item_name,
            quantity,
            unit,
            bills_of_material!inner (
              id
            )
          )
        `)
        .eq('is_selected', true)
        .eq('bom_items.bills_of_material.id', bomId);

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_url: item.product_url,
        price: item.price,
        vendor: item.vendor,
        bom_item: {
          item_name: (item.bom_items as any).item_name,
          quantity: (item.bom_items as any).quantity,
          unit: (item.bom_items as any).unit,
        }
      }));

      setItems(formatted);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shopping list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('product_matches')
        .update({ is_selected: false })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemId));
      toast({
        title: 'Removed',
        description: 'Item removed from shopping list',
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Item', 'Product', 'Vendor', 'Price', 'Quantity', 'URL'];
    const rows = items.map(item => [
      item.bom_item.item_name,
      item.product_name,
      item.vendor,
      item.price ? `$${item.price.toFixed(2)}` : 'N/A',
      `${item.bom_item.quantity} ${item.bom_item.unit || ''}`.trim(),
      item.product_url
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const groupedByVendor = items.reduce((acc, item) => {
    if (!acc[item.vendor]) {
      acc[item.vendor] = [];
    }
    acc[item.vendor].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const totalCost = items.reduce((sum, item) => sum + (item.price || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Your shopping list is empty. Add products from the search results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Shopping List</CardTitle>
            <CardDescription>
              {items.length} items · Total: ${totalCost.toFixed(2)}
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(groupedByVendor).map(([vendor, vendorItems]) => {
          const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price || 0), 0);
          
          return (
            <div key={vendor} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{vendor}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {vendorItems.length} items
                  </span>
                </div>
                <span className="font-semibold">${vendorTotal.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                {vendorItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.bom_item.item_name}</p>
                      <p className="text-sm text-muted-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quantity: {item.bom_item.quantity} {item.bom_item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.price && (
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
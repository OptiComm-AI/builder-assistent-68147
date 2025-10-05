import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface BOMItem {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  estimated_unit_price: number | null;
  estimated_total_price: number | null;
  priority: string;
  notes: string | null;
}

interface BOM {
  id: string;
  total_estimated_cost: number | null;
  status: string;
  generated_at: string;
}

interface Props {
  bomId: string;
  onSearchProducts: (itemId: string, searchQuery: string) => void;
  onSearchSelected?: (items: Array<{ id: string; name: string }>) => void;
  onSearchAll?: (items: Array<{ id: string; name: string }>) => void;
  isSearching?: boolean;
}

export const BOMReview = ({ 
  bomId, 
  onSearchProducts, 
  onSearchSelected,
  onSearchAll,
  isSearching = false 
}: Props) => {
  const [bom, setBom] = useState<BOM | null>(null);
  const [items, setItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchBOM();
  }, [bomId]);

  const fetchBOM = async () => {
    try {
      setLoading(true);

      const { data: bomData, error: bomError } = await supabase
        .from('bills_of_material')
        .select('*')
        .eq('id', bomId)
        .single();

      if (bomError) throw bomError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('bom_items')
        .select('*')
        .eq('bom_id', bomId)
        .order('category', { ascending: true });

      if (itemsError) throw itemsError;

      setBom(bomData);
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching BOM:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Bill of Materials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BOMItem[]>);

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSearchSelected = () => {
    const selectedItemsData = items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({ id: item.id, name: item.item_name }));
    
    if (selectedItemsData.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select items to search',
        variant: 'destructive',
      });
      return;
    }
    
    onSearchSelected?.(selectedItemsData);
  };

  const handleSearchAllItems = () => {
    const allItemsData = items.map(item => ({ id: item.id, name: item.item_name }));
    onSearchAll?.(allItemsData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bill of Materials
            </CardTitle>
            <CardDescription>
              Generated on {new Date(bom?.generated_at || '').toLocaleDateString()}
              {bom?.total_estimated_cost && (
                <span className="ml-4 text-lg font-semibold">
                  Total: ${bom.total_estimated_cost.toFixed(2)}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer">
                Select All
              </label>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSearchSelected}
              disabled={isSearching || selectedItems.size === 0}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Search Selected ({selectedItems.size})
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSearchAllItems}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Search All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="multiple" defaultValue={Object.keys(groupedItems)} className="w-full">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const categoryTotal = categoryItems.reduce(
              (sum, item) => sum + (item.estimated_total_price || 0),
              0
            );

            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{category}</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{categoryItems.length} items</Badge>
                      {categoryTotal > 0 && (
                        <span className="text-sm">${categoryTotal.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => handleToggleItem(item.id, checked as boolean)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.item_name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                <div>
                                  <span className="font-medium">Quantity:</span>{' '}
                                  {item.quantity} {item.unit}
                                </div>
                                {item.estimated_unit_price && (
                                  <>
                                    <div>
                                      <span className="font-medium">Unit Price:</span>{' '}
                                      ${item.estimated_unit_price.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total:</span>{' '}
                                      ${(item.estimated_total_price || 0).toFixed(2)}
                                    </div>
                                  </>
                                )}
                              </div>

                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSearchProducts(item.id, item.item_name)}
                                disabled={isSearching}
                              >
                                {isSearching ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Searching...
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 mr-1" />
                                    Find Products
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
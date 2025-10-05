import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, ShoppingCart, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductMatch {
  id: string;
  product_name: string;
  product_url: string;
  price: number | null;
  vendor: string;
  in_stock: boolean | null;
  match_score: number | null;
  is_selected: boolean;
}

interface Props {
  bomItemId: string;
  onAddToList: (productId: string) => void;
}

export const ProductSearch = ({ bomItemId, onAddToList }: Props) => {
  const [products, setProducts] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [bomItemId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_matches')
        .select('*')
        .eq('bom_item_id', bomItemId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product matches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('product_matches')
        .update({ is_selected: true })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_selected: true } : p
      ));

      toast({
        title: 'Added to Shopping List',
        description: 'Product has been added to your shopping list',
      });

      onAddToList(productId);
    } catch (error) {
      console.error('Error selecting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to list',
        variant: 'destructive',
      });
    }
  };

  const getMatchColor = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'outline';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No products found. Click "Find Products" to search online.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className={product.is_selected ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">
                    {product.product_name}
                  </CardTitle>
                  {product.is_selected && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline">{product.vendor}</Badge>
                  {product.match_score && (
                    <Badge variant={getMatchColor(product.match_score)}>
                      {product.match_score}% match
                    </Badge>
                  )}
                  {product.in_stock && (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {product.price && (
                  <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                )}

                <div className="flex gap-2">
                  {!product.is_selected && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to List
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={product.is_selected ? 'flex-1' : ''}
                    asChild
                  >
                    <a
                      href={product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
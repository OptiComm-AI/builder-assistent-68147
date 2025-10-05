import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BOMList from "./BOMList";
import { BOMReview } from "./BOMReview";
import { ProductSearch } from "./ProductSearch";
import { ShoppingList } from "./ShoppingList";
import BOMStats from "./BOMStats";

const sb = supabase as unknown as any;

interface ProjectMaterialsProps {
  projectId: string;
  onBOMGenerated?: () => void;
}

const ProjectMaterials = ({ projectId, onBOMGenerated }: ProjectMaterialsProps) => {
  const { toast } = useToast();
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [selectedBomItemId, setSelectedBomItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all BOMs for this project
  const { data: boms, isLoading, refetch } = useQuery({
    queryKey: ["project-boms", projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("bills_of_material")
        .select(`
          *,
          conversations (
            title,
            created_at
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Auto-select the most recent BOM
  useEffect(() => {
    if (boms && boms.length > 0 && !selectedBomId) {
      setSelectedBomId(boms[0].id);
    }
  }, [boms, selectedBomId]);

  const handleGenerateBOM = async () => {
    setIsGenerating(true);
    
    try {
      // Get the latest conversation for this project
      const { data: conversations } = await sb
        .from("conversations")
        .select("id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1);

      const conversationId = conversations?.[0]?.id || null;

      const { data, error } = await sb.functions.invoke("generate-bom", {
        body: { 
          projectId, 
          conversationId 
        },
      });

      if (error) throw error;

      toast({
        title: "Bill of Materials Generated",
        description: `Successfully generated BOM with ${data.itemCount} items`,
      });

      setSelectedBomId(data.bomId);
      setActiveTab("details");
      refetch();
      onBOMGenerated?.();
    } catch (error: any) {
      console.error("Error generating BOM:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate Bill of Materials",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchProducts = async (bomItemId: string, searchQuery: string) => {
    setSelectedBomItemId(bomItemId);
    setIsSearching(true);
    
    try {
      // Detect language from project data or recent BOM items
      const detectLanguage = () => {
        const projectName = boms?.[0]?.conversations?.title || '';
        const bomText = JSON.stringify(boms?.[0] || '');
        const combinedText = projectName + bomText;
        
        // Romanian detection: special characters and common words
        if (/[ăâîșțĂÂÎȘȚ]/.test(combinedText) || 
            /\b(și|sau|este|sunt|pentru|cu|la|în|pe|de)\b/i.test(combinedText)) {
          return 'ro';
        }
        return 'en';
      };

      const language = detectLanguage();
      console.log('Searching products for BOM item:', bomItemId, 'Query:', searchQuery, 'Language:', language);
      
      const { data, error } = await sb.functions.invoke("search-products", {
        body: { 
          bomItemId,
          searchQuery,
          language
        },
      });

      if (error) throw error;

      toast({
        title: "Product Search Complete",
        description: `Found ${data.matchCount} products from vendors`,
      });

      setActiveTab("products");
    } catch (error: any) {
      console.error("Error searching products:", error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search for products",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <BOMStats projectId={projectId} boms={boms || []} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {selectedBomId && (
              <>
                <TabsTrigger value="details">BOM Details</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="shopping">Shopping List</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <Button
            onClick={handleGenerateBOM}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Generate New BOM
              </>
            )}
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {!boms || boms.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bills of Materials Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate a Bill of Materials from your project details and conversations
              </p>
              <Button onClick={handleGenerateBOM} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Generate First BOM
                  </>
                )}
              </Button>
            </div>
          ) : (
            <BOMList
              boms={boms}
              selectedBomId={selectedBomId}
              onSelectBOM={(id) => {
                setSelectedBomId(id);
                setActiveTab("details");
              }}
            />
          )}
        </TabsContent>

        {selectedBomId && (
          <>
            <TabsContent value="details">
              <BOMReview
                bomId={selectedBomId}
                onSearchProducts={handleSearchProducts}
                isSearching={isSearching}
              />
            </TabsContent>

            <TabsContent value="products">
              {selectedBomItemId ? (
                <ProductSearch
                  bomItemId={selectedBomItemId}
                  onAddToList={() => {
                    toast({
                      title: "Added to shopping list",
                      description: "Product has been added to your shopping list",
                    });
                  }}
                />
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select an item from the BOM Details tab to search for products
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shopping">
              <ShoppingList bomId={selectedBomId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ProjectMaterials;

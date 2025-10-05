import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface BOM {
  id: string;
  created_at: string;
  total_estimated_cost: number | null;
  status: string;
  conversations?: {
    title: string | null;
    created_at: string;
  } | null;
}

interface BOMListProps {
  boms: BOM[];
  selectedBomId: string | null;
  onSelectBOM: (id: string) => void;
}

const BOMList = ({ boms, selectedBomId, onSelectBOM }: BOMListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'draft':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">All Bills of Materials</h3>
      
      <div className="grid gap-4">
        {boms.map((bom) => (
          <Card
            key={bom.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedBomId === bom.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectBOM(bom.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {bom.conversations?.title || 'Project BOM'}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(bom.status)}>
                  {bom.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(bom.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {bom.total_estimated_cost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">
                        ${bom.total_estimated_cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedBomId === bom.id && (
                  <div className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Selected</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BOMList;

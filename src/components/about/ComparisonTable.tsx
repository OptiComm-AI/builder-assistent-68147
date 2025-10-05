import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const ComparisonTable = () => {
  const competitors = [
    {
      name: "RenovateAI",
      aiPlanning: true,
      autoBOM: true,
      multiVendor: true,
      designGen: true,
      isUs: true,
    },
    {
      name: "Houzz",
      aiPlanning: false,
      autoBOM: false,
      multiVendor: false,
      designGen: true,
      isUs: false,
    },
    {
      name: "HomeAdvisor",
      aiPlanning: false,
      autoBOM: false,
      multiVendor: false,
      designGen: false,
      isUs: false,
    },
    {
      name: "Buildertrend",
      aiPlanning: false,
      autoBOM: true,
      multiVendor: false,
      designGen: false,
      isUs: false,
    },
    {
      name: "DIY Retailers",
      aiPlanning: false,
      autoBOM: false,
      multiVendor: false,
      designGen: false,
      isUs: false,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">Platform</TableHead>
            <TableHead className="text-center">AI Planning</TableHead>
            <TableHead className="text-center">Auto BOM</TableHead>
            <TableHead className="text-center">Multi-Vendor</TableHead>
            <TableHead className="text-center">Design Gen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((competitor, idx) => (
            <TableRow
              key={idx}
              className={competitor.isUs ? "gradient-accent font-bold" : ""}
            >
              <TableCell className={competitor.isUs ? "text-primary-foreground" : ""}>
                {competitor.name}
              </TableCell>
              <TableCell className="text-center">
                {competitor.aiPlanning ? (
                  <Check className={`h-5 w-5 mx-auto ${competitor.isUs ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {competitor.autoBOM ? (
                  <Check className={`h-5 w-5 mx-auto ${competitor.isUs ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {competitor.multiVendor ? (
                  <Check className={`h-5 w-5 mx-auto ${competitor.isUs ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {competitor.designGen ? (
                  <Check className={`h-5 w-5 mx-auto ${competitor.isUs ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default ComparisonTable;

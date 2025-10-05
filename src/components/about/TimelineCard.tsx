import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Rocket } from "lucide-react";

interface TimelineCardProps {
  quarter: string;
  title: string;
  items: string[];
  status: "completed" | "in-progress" | "planned" | "future";
}

const TimelineCard = ({ quarter, title, items, status }: TimelineCardProps) => {
  const statusConfig = {
    completed: { icon: CheckCircle, color: "text-primary", badge: "Completed" },
    "in-progress": { icon: Clock, color: "text-warning", badge: "In Progress" },
    planned: { icon: Rocket, color: "text-accent", badge: "Planned" },
    future: { icon: Rocket, color: "text-muted-foreground", badge: "Future" },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="hover-scale transition-smooth relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gradient-hero" />
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{quarter}</Badge>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <Badge className="mt-4 w-full justify-center" variant="secondary">
          {config.badge}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default TimelineCard;

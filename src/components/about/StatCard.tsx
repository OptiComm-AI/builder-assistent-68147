import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

const StatCard = ({ icon: Icon, value, suffix = "", prefix = "", label }: StatCardProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.min(increment * currentStep, value));
      } else {
        clearInterval(timer);
        setCount(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="bg-background/20 backdrop-blur-sm border-primary-foreground/20 hover-scale transition-smooth">
      <CardContent className="pt-6 text-center">
        <Icon className="h-12 w-12 mx-auto mb-4 text-primary-foreground" />
        <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
          {prefix}
          {count.toFixed(1)}
          {suffix}
        </div>
        <div className="text-sm text-primary-foreground/80">{label}</div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

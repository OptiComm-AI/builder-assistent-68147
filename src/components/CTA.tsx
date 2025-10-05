import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const benefits = [
  "Start for free, no credit card required",
  "Get your first design in under 5 minutes",
  "Access to thousands of verified sellers",
  "24/7 AI support at every step"
];

const CTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartProject = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleWatchDemo = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
            Ready to Transform
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"> Your Space?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of DIY enthusiasts who've turned their vision into reality with our AI assistant.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="hero" size="xl" className="group shadow-glow" onClick={handleStartProject}>
              Start Your First Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" onClick={handleWatchDemo}>
              Watch Demo Video
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground pt-4">
            Trusted by 50,000+ creators • 4.9/5 average rating
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

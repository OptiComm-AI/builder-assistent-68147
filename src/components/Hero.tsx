import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-transformation.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-subtle -z-10" />
      
      {/* Floating accent blur */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Project Assistant</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Turn Your
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Vision </span>
                Into Reality
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                The AI assistant that designs, plans, and guides you through every DIY project. 
                From inspiration to completion, we're with you every step of the way.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Start Your Project
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl">
                See How It Works
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center gap-8 pt-6 border-t border-border/50">
              <div>
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Projects Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </div>
            </div>
          </div>
          
          {/* Right image */}
          <div className="relative">
            <div className="absolute -inset-4 gradient-hero opacity-20 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl overflow-hidden shadow-elegant border border-border/50 backdrop-blur">
              <img 
                src={heroImage} 
                alt="Before and after home renovation transformation powered by AI" 
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-glow border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">AI Design Ready</div>
                  <div className="text-sm text-muted-foreground">In 30 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

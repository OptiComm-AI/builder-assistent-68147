import { Camera, Palette, Calculator, Users, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Visual Space Analysis",
    description: "Upload photos and let AI understand your space dimensions and layout automatically."
  },
  {
    icon: Palette,
    title: "Photorealistic Designs",
    description: "See your future space before you start. Multiple design styles at your fingertips."
  },
  {
    icon: Calculator,
    title: "Smart Budgeting",
    description: "Automatic cost estimates with intelligent product alternatives to match your budget."
  },
  {
    icon: Users,
    title: "Expert Matching",
    description: "Need a pro? Get matched with vetted contractors for specialized tasks."
  },
  {
    icon: Clock,
    title: "Real-Time Guidance",
    description: "Ask questions anytime during your project. Get instant, contextual help."
  },
  {
    icon: Shield,
    title: "Trusted Marketplace",
    description: "Quality products from verified sellers. Your satisfaction guaranteed."
  }
];

const Features = () => {
  return (
    <section className="py-24 gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Everything You Need to
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent"> Build With Confidence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI capabilities combined with marketplace convenience.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div 
                key={index}
                className="bg-card p-8 rounded-xl border border-border/50 hover:border-primary/50 transition-smooth hover:shadow-elegant group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-smooth">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

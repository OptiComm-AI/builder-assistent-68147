import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Lightbulb,
  ShoppingCart,
  Hammer,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/about/StatCard";
import ComparisonTable from "@/components/about/ComparisonTable";
import { Card, CardContent } from "@/components/ui/card";
import stressedImage from "@/assets/stressed-homeowner.jpg";
import happyImage from "@/assets/happy-renovation.jpg";
import aiInterfaceImage from "@/assets/ai-interface.jpg";
import beforeAfterImage from "@/assets/before-after.jpg";
import futureVisionImage from "@/assets/future-vision.jpg";
import communityImage from "@/assets/community.jpg";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative gradient-hero py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <Badge className="mb-4 text-lg px-4 py-2" variant="secondary">
              About RenobuildAI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
              Transforming Home Renovation with AI
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-3xl mx-auto">
              Making professional-grade renovation planning accessible, affordable, and stress-free for every homeowner
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <StatCard
                icon={DollarSign}
                value={1.8}
                suffix="T"
                label="Global Market Size"
                prefix="$"
              />
              <StatCard
                icon={TrendingUp}
                value={25}
                suffix="%"
                label="Average Cost Savings"
              />
              <StatCard
                icon={Users}
                value={127}
                suffix="M+"
                label="Target Homeowners"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The Challenge Every Homeowner Faces</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Meet Sarah. She dreamed of renovating her kitchen—modern countertops, new cabinets, better lighting. But where to start? She spent weeks browsing Pinterest, visiting hardware stores, and trying to calculate costs on spreadsheets. The quotes from contractors varied wildly, and she couldn't tell if she was getting a fair deal.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                Like 73% of homeowners, Sarah struggled with material planning and cost estimation. She felt overwhelmed by the complexity, frustrated by hidden costs, and worried about making expensive mistakes. Her dream kitchen project felt more like a nightmare.
              </p>
              <p className="text-lg text-muted-foreground">
                There had to be a better way.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <img 
                src={stressedImage} 
                alt="Homeowner overwhelmed with renovation planning" 
                className="rounded-2xl shadow-elegant hover-scale transition-smooth"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={happyImage} 
                alt="Happy homeowner in renovated space" 
                className="rounded-2xl shadow-elegant hover-scale transition-smooth"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">A New Way Forward</h2>
              <p className="text-lg text-muted-foreground mb-4">
                That's why we built RenobuildAI. We believe that transforming your living space shouldn't require a degree in project management or weeks of research. With our AI-powered platform, Sarah simply described her vision in natural conversation—"I want a modern kitchen with marble countertops and plenty of storage."
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                Within minutes, RenobuildAI understood her needs, generated a detailed materials list, and searched dozens of retailers to find the best prices. No spreadsheets, no stress, no guesswork. Sarah saved $3,200 and completed her planning in just three days instead of three months.
              </p>
              <p className="text-lg text-primary font-semibold">
                This is the future of home renovation—and it's available today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Journey */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How RenobuildAI Works</h2>
            <p className="text-xl text-muted-foreground">Your journey from inspiration to execution in four simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="hover-scale transition-smooth hover:shadow-glow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">1. Share Your Vision</h3>
                    <p className="text-muted-foreground">
                      Talk to our AI like you'd chat with a friend. Describe your dream renovation, upload inspiration photos, or simply tell us what you want to achieve. No technical jargon needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth hover:shadow-glow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">2. Get Your Plan</h3>
                    <p className="text-muted-foreground">
                      Our AI instantly generates a detailed bill of materials with exact quantities, specifications, and cost estimates. Every item you need, calculated automatically based on your space and requirements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth hover:shadow-glow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">3. Find Best Prices</h3>
                    <p className="text-muted-foreground">
                      We search multiple vendors simultaneously—Enmax, MaxBau, and more—to find you the best deals. Real-time pricing, availability checks, and instant comparisons save you 18-25% on average.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale transition-smooth hover:shadow-glow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                    <Hammer className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">4. Bring It to Life</h3>
                    <p className="text-muted-foreground">
                      Track your project progress, manage your shopping list, and visualize the final result with AI-generated designs. Transform your space with confidence, knowing every detail is covered.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <img 
              src={aiInterfaceImage} 
              alt="RenobuildAI interface in action" 
              className="rounded-2xl shadow-elegant max-w-3xl mx-auto hover-scale transition-smooth"
            />
            <p className="text-sm text-muted-foreground mt-4">Our intuitive AI chat interface makes renovation planning feel effortless</p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Makes Us Different</h2>
            <p className="text-xl text-muted-foreground">The only complete end-to-end AI renovation platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-muted rounded-full"></div>
              <div className="pl-8">
                <h3 className="text-2xl font-bold mb-4 text-muted-foreground">The Traditional Way</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Weeks of research and price comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Manual calculations and spreadsheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Visiting multiple stores physically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Expensive consultant fees or going solo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">Budget overruns of 20-50% on average</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 gradient-hero rounded-full"></div>
              <div className="pl-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  The RenobuildAI Way
                  <Sparkles className="h-6 w-6 text-primary" />
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Planning complete in minutes with AI conversation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Automatic bill of materials generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Instant multi-vendor price comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Professional-grade guidance at consumer prices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Save 18-25% with transparent pricing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <img 
              src={beforeAfterImage} 
              alt="Before and after renovation transformation" 
              className="rounded-2xl shadow-elegant hover-scale transition-smooth"
            />
            <p className="text-sm text-muted-foreground mt-4 text-center">Real transformations, powered by intelligent planning</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How We Stack Up</h2>
            <p className="text-xl text-muted-foreground">The complete solution vs. partial alternatives</p>
          </div>
          <ComparisonTable />
        </div>
      </section>

      {/* Technology Behind the Magic */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Technology Behind the Magic</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              RenobuildAI is powered by cutting-edge artificial intelligence and modern web technologies. We combine Google Gemini and OpenAI's latest models with real-time vendor integrations to deliver instant, accurate renovation planning. Our platform is built on enterprise-grade infrastructure ensuring security, speed, and reliability for every user.
            </p>
          </div>
        </div>
      </section>

      {/* Vision for the Future */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Vision for the Future</h2>
              <p className="text-xl text-muted-foreground mb-6">
                Imagine a world where transforming your living space is as easy as having a conversation. Where augmented reality lets you visualize every change before making it. Where contractors, materials, and designs come together seamlessly through intelligent automation.
              </p>
              <p className="text-xl text-muted-foreground mb-6">
                We're building that future today. From our roots in Eastern Europe, we're expanding across continents, adding new capabilities, and connecting millions of homeowners with the tools they need to create their dream spaces.
              </p>
              <p className="text-xl font-semibold text-primary">
                Every human deserves to create their dream living space—and we're making it possible.
              </p>
            </div>
            <div>
              <img 
                src={futureVisionImage} 
                alt="Future of home renovation with AR and AI" 
                className="rounded-2xl shadow-elegant hover-scale transition-smooth"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Join the Movement CTA */}
      <section className="py-24 px-4 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Join Thousands of Homeowners Transforming Their Spaces
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Start planning your dream renovation today with AI-powered intelligence, transparent pricing, and professional-grade guidance at your fingertips.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Project <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-background/10 hover:bg-background/20 border-primary-foreground/20 text-primary-foreground">
              See How It Works
            </Button>
          </div>

          <img 
            src={communityImage} 
            alt="Community of happy homeowners" 
            className="rounded-2xl shadow-elegant max-w-2xl mx-auto"
          />
        </div>
      </section>
    </div>
  );
};

export default About;

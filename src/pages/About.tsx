import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Users,
  Bot,
  ListChecks,
  Search,
  Wand2,
  TrendingDown,
  Languages,
  MessageSquare,
  Lightbulb,
  ShoppingCart,
  Hammer,
  AlertCircle,
  CheckCircle,
  Globe,
  Rocket,
  Target,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/about/StatCard";
import FeatureCard from "@/components/about/FeatureCard";
import TimelineCard from "@/components/about/TimelineCard";
import ComparisonTable from "@/components/about/ComparisonTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Bot,
      title: "Conversational AI Planning",
      description: "Natural language project planning powered by advanced AI models",
    },
    {
      icon: ListChecks,
      title: "Intelligent BOM Generation",
      description: "Automated bill of materials with quantities, specs, and cost estimates",
    },
    {
      icon: Search,
      title: "Multi-Vendor Product Matching",
      description: "Real-time price comparison across major retailers like Enmax and MaxBau",
    },
    {
      icon: Wand2,
      title: "Visual Design Generation",
      description: "AI-powered renovation visualization to see your project before execution",
    },
    {
      icon: TrendingDown,
      title: "Smart Budget Optimization",
      description: "18-25% average cost savings through intelligent product matching",
    },
    {
      icon: Languages,
      title: "Multilingual Support",
      description: "Currently supporting English and Romanian with expansion planned",
    },
  ];

  const steps = [
    {
      icon: MessageSquare,
      title: "Inspiration",
      description: "Describe your renovation vision through conversational AI",
      details: "Natural language input, image uploads, style preferences",
    },
    {
      icon: Lightbulb,
      title: "Planning",
      description: "AI generates detailed BOM with quantities and specifications",
      details: "Automated calculations, material lists, timeline estimates",
    },
    {
      icon: ShoppingCart,
      title: "Procurement",
      description: "Multi-vendor search finds best prices across retailers",
      details: "Real-time pricing, availability checks, cost comparisons",
    },
    {
      icon: Hammer,
      title: "Execution",
      description: "Track progress and manage your renovation project",
      details: "Project dashboard, shopping lists, contractor matching",
    },
  ];

  const problems = [
    "Overwhelming complexity for DIY homeowners",
    "Opaque pricing and hidden costs",
    "Fragmented vendor landscape",
    "No professional guidance without high consultant fees",
  ];

  const solutions = [
    "Conversational AI simplifies planning",
    "Transparent cost breakdown upfront",
    "Unified multi-vendor search platform",
    "Professional-grade guidance at consumer prices",
  ];

  const techStack = [
    {
      category: "Frontend",
      technologies: ["React", "TypeScript", "TailwindCSS", "Vite"],
    },
    {
      category: "Backend",
      technologies: ["Supabase", "PostgreSQL", "Row-Level Security", "Edge Functions"],
    },
    {
      category: "AI Models",
      technologies: ["Google Gemini 2.5", "OpenAI GPT-5", "Image Generation", "NLP"],
    },
    {
      category: "Integration",
      technologies: ["Firecrawl", "Multi-Vendor APIs", "Real-time Search"],
    },
  ];

  const revenueStreams = [
    { name: "Vendor Commission", percentage: 40, amount: "3-7% per sale" },
    { name: "Premium Subscriptions", percentage: 25, amount: "$9.99/month" },
    { name: "Contractor Referrals", percentage: 20, amount: "15% commission" },
    { name: "Enterprise Licensing", percentage: 10, amount: "$50K+ annually" },
    { name: "Data Analytics", percentage: 5, amount: "Market insights" },
  ];

  const roadmapQ2 = [
    "Advanced visual design generation",
    "Enhanced BOM intelligence",
    "Expanded vendor integrations",
  ];

  const roadmapQ4 = [
    "Contractor marketplace launch",
    "Mobile app (iOS & Android)",
    "Eastern Europe expansion",
  ];

  const roadmap2026 = [
    "Western Europe & US markets",
    "B2B enterprise solutions",
    "AR visualization features",
  ];

  const trends = [
    {
      icon: Brain,
      title: "AI Maturity",
      stat: "ChatGPT reached 100M users in 2 months",
      description: "Multimodal AI enables unprecedented automation",
    },
    {
      icon: Hammer,
      title: "DIY Boom",
      stat: "70% of homeowners prefer DIY",
      description: "Post-pandemic surge in home improvement projects",
    },
    {
      icon: DollarSign,
      title: "Cost Sensitivity",
      stat: "Inflation drives price comparison",
      description: "Homeowners seeking maximum value for investments",
    },
    {
      icon: Globe,
      title: "Digital-First",
      stat: "E-commerce penetration growing 15% YoY",
      description: "Online research before every major purchase",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative gradient-hero py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <Badge className="mb-4 text-lg px-4 py-2" variant="secondary">
              About RenovateAI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
              Transforming Home Renovation with AI
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-3xl mx-auto">
              Empowering every human to create their dream living space through intelligent automation
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
                icon={TrendingDown}
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

      {/* Problem & Solution */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                  The Problem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {problems.map((problem, idx) => (
                    <li key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{problem}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="gradient-accent border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <CheckCircle className="h-6 w-6" />
                  Our Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {solutions.map((solution, idx) => (
                    <li key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <CheckCircle className="w-5 h-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-primary-foreground/90">{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Your journey from inspiration to execution</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  <Card className="hover-scale transition-smooth hover:shadow-glow cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mb-4 shadow-glow">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.details}</p>
                    </CardContent>
                  </Card>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 text-primary z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-muted-foreground">Powerful capabilities built for modern homeowners</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={idx * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Technology Stack</h2>
            <p className="text-xl text-muted-foreground">Built on enterprise-grade, modern technologies</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((stack, idx) => (
              <Card key={idx} className="hover-scale transition-smooth">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {stack.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {stack.technologies.map((tech, techIdx) => (
                      <li key={techIdx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {tech}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantage */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Competitive Advantage</h2>
            <p className="text-xl text-muted-foreground">The only end-to-end AI-powered renovation platform</p>
          </div>

          <ComparisonTable />
        </div>
      </section>

      {/* Business Model */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Business Model</h2>
            <p className="text-xl text-muted-foreground">Diversified revenue streams for sustainable growth</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {revenueStreams.map((stream, idx) => (
                <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{stream.name}</span>
                    <span className="text-muted-foreground">{stream.amount}</span>
                  </div>
                  <Progress value={stream.percentage} className="h-3" />
                </div>
              ))}
            </div>

            <Card className="gradient-accent shadow-glow">
              <CardHeader>
                <CardTitle className="text-2xl text-primary-foreground">Unit Economics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-primary-foreground/90">
                <div className="flex justify-between items-center">
                  <span>Average Project Value</span>
                  <span className="text-2xl font-bold">$3,500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Platform Commission</span>
                  <span className="text-2xl font-bold">$175</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Customer Acquisition Cost</span>
                  <span className="text-2xl font-bold">$45</span>
                </div>
                <div className="border-t border-primary-foreground/20 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">LTV:CAC Ratio</span>
                    <span className="text-3xl font-bold text-primary-foreground">3.9:1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Traction */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Current Traction</h2>
            <p className="text-xl text-muted-foreground">Live MVP with core functionality deployed</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {["AI-powered conversational planning", "Automated BOM generation", "Multi-vendor product search (Enmax, MaxBau)", "Real-time cost estimation", "User authentication & project management", "Bilingual support (EN/RO)"].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Time to First BOM</span>
                    <Badge variant="secondary">&lt; 5 min</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Average Cost Savings</span>
                    <Badge variant="secondary">18-25%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Product Match Rate</span>
                    <Badge variant="secondary">85%+</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>User Satisfaction</span>
                    <Badge variant="secondary">4.7/5</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Roadmap</h2>
            <p className="text-xl text-muted-foreground">Strategic milestones for 2025 and beyond</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TimelineCard
              quarter="Q2 2025"
              title="Platform Enhancement"
              items={roadmapQ2}
              status="in-progress"
            />
            <TimelineCard
              quarter="Q4 2025"
              title="Market Expansion"
              items={roadmapQ4}
              status="planned"
            />
            <TimelineCard
              quarter="2026+"
              title="Global Scale"
              items={roadmap2026}
              status="future"
            />
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Now?</h2>
            <p className="text-xl text-muted-foreground">The perfect convergence of market forces</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trends.map((trend, idx) => {
              const Icon = trend.icon;
              return (
                <Card key={idx} className="hover-scale transition-smooth">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{trend.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{trend.stat}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Investment CTA */}
      <section className="py-20 px-4 gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 text-lg px-4 py-2" variant="secondary">
            Investment Opportunity
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Join Us in Revolutionizing Home Renovation
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Seeking $2.5M Seed Round to scale operations and capture market leadership
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Engineering & Product</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">30%</div>
                <div className="text-sm text-muted-foreground">Marketing & Growth</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">20%</div>
                <div className="text-sm text-muted-foreground">Market Expansion</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10%</div>
                <div className="text-sm text-muted-foreground">Operations & Legal</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-background/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-primary-foreground mb-6">18-Month Milestones</h3>
            <div className="grid md:grid-cols-3 gap-6 text-primary-foreground/90">
              <div>
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">15</div>
                <div className="text-sm">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$2.8M</div>
                <div className="text-sm">ARR Target</div>
              </div>
            </div>
          </div>

          <Button size="xl" variant="secondary" className="shadow-glow">
            Request Investment Deck <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;

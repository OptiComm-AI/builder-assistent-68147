import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot } from "lucide-react";
import aiIcon from "@/assets/ai-icon.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Project Assistant. Tell me about your project or upload a photo of your space to get started. What would you like to create today?"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'd love to help you with that! Could you share a photo of your space so I can provide personalized design suggestions?"
      }]);
    }, 1000);
    
    setInput("");
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Chat With Your
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent"> AI Designer</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your vision in plain language. Get expert guidance instantly.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border/50 rounded-2xl shadow-elegant overflow-hidden">
            {/* Chat header */}
            <div className="gradient-hero p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <img src={aiIcon} alt="AI Assistant" className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">AI Project Assistant</h3>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Online & Ready
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-muted/20">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-accent-foreground" />
                    </div>
                  )}
                  
                  <div className={`max-w-md px-4 py-3 rounded-2xl ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground ml-auto" 
                      : "bg-card border border-border/50"
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Input */}
            <div className="p-6 border-t border-border/50 bg-card">
              <div className="flex gap-3">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Describe your project or ask a question..."
                  className="flex-1 h-12 text-base"
                />
                <Button 
                  onClick={handleSend}
                  variant="hero"
                  size="lg"
                  className="px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Powered by advanced AI • Upload photos for personalized designs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIChat;

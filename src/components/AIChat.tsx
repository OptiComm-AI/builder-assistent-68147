import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot, Image as ImageIcon, X, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import aiIcon from "@/assets/ai-icon.png";
import ProjectSelector from "@/components/ProjectSelector";
import { BOMReview } from "@/components/BOMReview";
import { ProductSearch } from "@/components/ProductSearch";
import { ShoppingList } from "@/components/ShoppingList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Temporary untyped alias until types regenerate
const sb = supabase as unknown as any;
import { Skeleton } from "@/components/ui/skeleton";
import { MessageContent } from "@/components/MessageContent";

interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  isGeneratedImage?: boolean;
}

interface ProjectData {
  name?: string;
  description?: string;
  budget_estimate?: number;
  timeline_weeks?: number;
  key_features?: string[];
  materials_mentioned?: string[];
  style_preferences?: string[];
}

interface AIChatProps {
  conversationId?: string;
  projectId?: string;
  onConversationCreated?: (conversationId: string) => void;
  mode?: 'homepage' | 'dedicated';
  onProjectDataExtracted?: (data: ProjectData) => void;
}

const AIChat = ({ 
  conversationId, 
  projectId, 
  onConversationCreated,
  mode = 'dedicated',
  onProjectDataExtracted
}: AIChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);
  const [messageCount, setMessageCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [userProjects, setUserProjects] = useState<{id: string, name: string}[]>([]);
  const [projectContext, setProjectContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [anonymousSessionId] = useState(() => `anon-${Date.now()}`);
  const [generationMode, setGenerationMode] = useState<'chat' | 'transformation' | 'text-generation'>('chat');
  
  // BOM-related state
  const [currentBomId, setCurrentBomId] = useState<string | null>(null);
  const [bomGenerating, setBomGenerating] = useState(false);
  const [selectedBomItemId, setSelectedBomItemId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect generation mode based on conversation state
  useEffect(() => {
    const hasUserImages = messages.some(m => m.image_url && m.role === 'user');
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    
    if (hasUserImages) {
      setGenerationMode('transformation');
    } else if (lastUserMsg?.content.toLowerCase().match(/generate|create|design|show me|make me/)) {
      setGenerationMode('text-generation');
    } else {
      setGenerationMode('chat');
    }
  }, [messages]);

  // Sync conversationId prop to state
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId]);

  // Sync projectId prop changes
  useEffect(() => {
    setCurrentProjectId(projectId);
  }, [projectId]);

  // Auto-load most recent conversation for project in dedicated mode
  useEffect(() => {
    if (mode === 'dedicated' && currentProjectId && user && !conversationId) {
      sb.from('conversations')
        .select('id')
        .eq('project_id', currentProjectId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setCurrentConversationId(data.id);
          }
        });
    }
  }, [mode, currentProjectId, user, conversationId]);

  // Fetch user's projects for project selector
  useEffect(() => {
    if (user && mode === 'homepage') {
      sb.from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }: any) => {
          if (data) setUserProjects(data);
        });
    }
  }, [user, mode]);

  // Fetch project context when projectId is set
  useEffect(() => {
    if (currentProjectId && currentProjectId !== 'new') {
      sb.from('projects')
        .select('id, name, budget, phase, status, timeline_weeks')
        .eq('id', currentProjectId)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) setProjectContext(data);
        });
    } else {
      setProjectContext(null);
    }
  }, [currentProjectId]);

  // Load conversation messages when currentConversationId changes
  useEffect(() => {
    if (!user) {
      // Anonymous user - load from localStorage
      if (mode === 'homepage') {
        const stored = localStorage.getItem(`anonymous-chat-${anonymousSessionId}`);
        if (stored) {
          try {
            const storedMessages = JSON.parse(stored);
            setMessages(storedMessages);
            return;
          } catch (e) {
            console.error("Failed to parse stored messages:", e);
          }
        }
      }
      
      setMessages([{
        role: "assistant",
        content: "Hi! I'm your AI Project Assistant. Tell me about your renovation or design project, and I'll help you plan it. What are you working on?"
      }]);
      return;
    }

    if (!currentConversationId) {
      // No conversation selected - show initial message
      setMessages([{
        role: "assistant",
        content: mode === 'homepage' && !user
          ? "Hi! I'm your AI Project Assistant. Tell me about your renovation or design project, and I'll help you plan it. What are you working on?"
          : projectContext 
            ? `Let's talk about your ${projectContext.name} project! What would you like to discuss?`
            : "Hi! I'm your AI Project Assistant. Tell me about your project or upload a photo of your space to get started. What would you like to create today?"
      }]);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await sb
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      if (data && data.length > 0) {
        setMessages(data.map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          image_url: msg.image_url || undefined
        })));
      } else {
        setMessages([{
          role: "assistant",
          content: "Hi! I'm your AI Project Assistant. Tell me about your project or upload a photo of your space to get started. What would you like to create today?"
        }]);
      }
    };

    loadMessages();

    // Generate summary when leaving a conversation
    return () => {
      if (currentConversationId && messages.length > 2) {
        supabase.functions.invoke('generate-conversation-summary', {
          body: { conversationId: currentConversationId }
        }).catch(err => console.error('Error generating summary:', err));
      }
    };
  }, [currentConversationId, mode, user, anonymousSessionId, projectContext]);

  // Realtime message updates
  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Prevent duplicate - check if message already exists in state
          setMessages(prev => {
            const exists = prev.some(m => 
              m.role === newMessage.role && 
              m.content === newMessage.content &&
              m.image_url === newMessage.image_url
            );
            
            if (exists) {
              console.log('Ignoring duplicate message from realtime subscription');
              return prev;
            }
            
            return [...prev, {
              role: newMessage.role,
              content: newMessage.content,
              image_url: newMessage.image_url || undefined
            }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      console.log('Uploading image:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError || !data) {
        console.error('Error uploading image:', uploadError);
        throw new Error(`Failed to upload: ${uploadError?.message || 'Unknown error'}`);
      }

      // Generate a signed URL that's valid for 1 hour (bucket is private)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-images')
        .createSignedUrl(data.path, 3600);

      if (signedUrlError || !signedUrlData) {
        console.error('Error generating signed URL:', signedUrlError);
        throw new Error(`Failed to generate URL: ${signedUrlError?.message || 'Unknown error'}`);
      }

      console.log('Image uploaded successfully, signed URL generated');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    const { data, error } = await sb
      .from("conversations")
      .insert({
        user_id: user.id,
        project_id: projectId,
        title: title
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    return data.id;
  };

  const saveMessage = async (convId: string, message: Message) => {
    const { error } = await sb
      .from("messages")
      .insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
        image_url: message.image_url
      });

    if (error) {
      console.error("Error saving message:", error);
    }

    // Update conversation timestamp
    await sb
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);
  };

  const streamChat = async (messagesToSend: Message[], convId: string) => {
    setIsLoading(true);
    let assistantContent = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          conversationId: convId,
          projectId: currentProjectId || projectId
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before sending another message.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Payment Required",
            description: "Please add credits to your workspace.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          toast({
            title: "Image Processing Failed",
            description: errorData.error || "Failed to process image. Please try a different image format.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to connect to AI");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch (e) {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":")) continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {}
        }
      }

      // Save the final assistant message
      if (assistantContent) {
        await saveMessage(convId, {
          role: "assistant",
          content: assistantContent
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const extractProjectInfo = async (messagesToExtract: Message[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-project-info', {
        body: { messages: messagesToExtract }
      });

      if (error) throw error;
      
      const projectData = data?.projectData as ProjectData;
      if (projectData && Object.keys(projectData).length > 0) {
        console.log("Extracted project data:", projectData);
        onProjectDataExtracted?.(projectData);
        
        // Update project if we have one
        if (currentProjectId && currentProjectId !== 'new') {
          await sb
            .from("projects")
            .update({
              ...(projectData.key_features && { key_features: projectData.key_features }),
              ...(projectData.materials_mentioned && { materials_mentioned: projectData.materials_mentioned }),
              ...(projectData.style_preferences && { style_preferences: projectData.style_preferences }),
              ...(projectData.budget_estimate && { budget_estimate: projectData.budget_estimate }),
              ...(projectData.timeline_weeks && { timeline_weeks: projectData.timeline_weeks }),
              last_chat_update: new Date().toISOString()
            })
            .eq("id", currentProjectId);
        }
      }
    } catch (error) {
      console.error("Error extracting project info:", error);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    // For anonymous users in homepage mode - stream AI chat without saving to DB
    if (mode === 'homepage' && !user) {
      const userMessage: Message = {
        role: "user",
        content: input.trim() || "Please analyze this image",
        ...(imagePreview && { image_url: imagePreview })
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      clearImage();
      
      // Save to localStorage
      localStorage.setItem(`anonymous-chat-${anonymousSessionId}`, JSON.stringify(updatedMessages));
      
      setMessageCount(prev => prev + 1);
      
      // Show signup prompt after 3 messages
      if (messageCount >= 2 && !showSignupPrompt) {
        setShowSignupPrompt(true);
      }
      
      // Stream AI chat for anonymous users (no DB save)
      setIsLoading(true);
      let assistantContent = "";
      
      try {
        const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
        
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: updatedMessages,
            conversationId: null,
            projectId: currentProjectId || null,
            isAnonymous: true
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast({
              title: "Rate Limit Exceeded",
              description: "Please wait a moment before sending another message.",
              variant: "destructive",
            });
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          if (response.status === 402) {
            toast({
              title: "Payment Required",
              description: "Please add credits to your workspace.",
              variant: "destructive",
            });
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}));
            toast({
              title: "Image Processing Failed",
              description: errorData.error || "Failed to process image. Please try a different image format.",
              variant: "destructive",
            });
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          throw new Error("Failed to connect to AI");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        // Add empty assistant message
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
        
        // Save final conversation to localStorage
        const finalMessages = [...updatedMessages, { role: "assistant", content: assistantContent }];
        localStorage.setItem(`anonymous-chat-${anonymousSessionId}`, JSON.stringify(finalMessages));
      } catch (error) {
        console.error("Chat error:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
      
      return;
    }
    
    // For authenticated users
    if (!user) return;
    
    let imageUrl: string | null = null;

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim() || "Please analyze this image",
      ...(imageUrl && { image_url: imageUrl })
    };

    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(userMessage.content);
      if (!convId) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }
      setCurrentConversationId(convId);
      onConversationCreated?.(convId);
    }

    // Save user message
    await saveMessage(convId, userMessage);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    clearImage();
    
    setMessageCount(prev => prev + 1);
    
    // Note: Project extraction happens automatically in the edge function
    streamChat(updatedMessages, convId);
  };

  const handleProjectSelect = (projectId: string) => {
    if (projectId === 'new') {
      setCurrentProjectId(undefined);
    } else {
      setCurrentProjectId(projectId);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(undefined);
    setMessages([{
      role: "assistant",
      content: "Hi! I'm your AI Project Assistant. Tell me about your project or upload a photo of your space to get started. What would you like to create today?"
    }]);
  };

  const handleGenerateBOM = async () => {
    if (!currentConversationId || !currentProjectId) {
      toast({
        title: "Cannot Generate BOM",
        description: "Please start a conversation and select a project first.",
        variant: "destructive",
      });
      return;
    }
    
    setBomGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-bom', {
        body: {
          conversationId: currentConversationId,
          projectId: currentProjectId
        }
      });
      
      if (error) throw error;
      
      setCurrentBomId(data.bomId);
      toast({
        title: "BOM Generated",
        description: `Created ${data.itemCount} items totaling $${data.totalCost.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error generating BOM:", error);
      toast({
        title: "Error",
        description: "Failed to generate Bill of Materials",
        variant: "destructive",
      });
    } finally {
      setBomGenerating(false);
    }
  };

  const handleSearchProducts = async (bomItemId: string) => {
    setSelectedBomItemId(bomItemId);
    try {
      const { error } = await supabase.functions.invoke('search-products', {
        body: { bomItemId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Product Search Complete",
        description: "Found matching products from multiple vendors",
      });
    } catch (error) {
      console.error("Error searching products:", error);
      toast({
        title: "Error",
        description: "Failed to search for products",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {showSignupPrompt && mode === 'homepage' && !user && (
        <div className="bg-primary/10 border-b border-primary/20 p-4">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <p className="text-sm">
              💡 <strong>Create a free account</strong> to save this conversation and track your project progress!
            </p>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/auth'}
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      )}
      <div className={mode === 'dedicated' ? "flex-1 min-h-0 flex flex-col" : "flex-1 flex items-center justify-center p-4"}>
        <div className={mode === 'dedicated' ? "w-full h-full min-h-0 flex flex-col" : "w-full max-w-4xl h-full flex flex-col"}>
          <div className={`bg-card border border-border/50 overflow-hidden flex flex-col h-full ${mode === 'dedicated' ? 'rounded-lg' : 'rounded-2xl shadow-elegant'}`}>
            {/* Chat header */}
            <div className="gradient-hero p-6 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                  <img src={aiIcon} alt="AI Assistant" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">AI Project Assistant</h3>
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online & Ready
                    {generationMode === 'transformation' && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 backdrop-blur border border-white/30 rounded-full text-xs flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Transformation Mode
                      </span>
                    )}
                    {generationMode === 'text-generation' && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 backdrop-blur border border-white/30 rounded-full text-xs flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Generation Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {mode === 'dedicated' && currentConversationId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20"
                >
                  New Chat
                </Button>
              )}
            </div>
            
            {/* Project Context Display */}
            {projectContext && (
              <div className="px-4 pt-4 pb-2 border-b border-border/30 bg-primary/5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Discussing:</span>
                  <span className="font-semibold text-foreground">{projectContext.name}</span>
                  {projectContext.budget && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">${projectContext.budget.toLocaleString()} budget</span>
                    </>
                  )}
                  {projectContext.timeline_weeks && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{projectContext.timeline_weeks} weeks</span>
                    </>
                  )}
                  {projectContext.phase && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground capitalize">{projectContext.phase}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Project Selector for logged-in users on homepage */}
            {user && mode === 'homepage' && (
              <div className="p-4 border-b border-border/50 bg-card">
                <ProjectSelector
                  projects={userProjects}
                  selectedProjectId={currentProjectId}
                  onProjectSelect={handleProjectSelect}
                  disabled={isLoading}
                />
              </div>
            )}
            
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-muted/20">
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
                  
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className={`px-4 py-3 rounded-2xl break-words overflow-hidden ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground ml-auto" 
                      : "bg-card border border-border/50"
                  }`} style={{ overflowWrap: 'break-word' }}>
                    {message.image_url && (
                      <div className="relative">
                        <img
                          src={message.image_url}
                          alt={message.isGeneratedImage ? "AI Generated Transformation" : "Uploaded"}
                          className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.image_url, '_blank')}
                        />
                        {message.content.includes('✨') && message.role === 'assistant' && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Generated
                          </div>
                        )}
                      </div>
                    )}
                    <MessageContent content={message.content} />
                  </div>
                  
                  {/* Quick action buttons for generated images */}
                  {message.image_url && message.role === 'assistant' && user && (
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(generationMode === 'transformation' 
                            ? "Try a different style" 
                            : "Generate another variation with different colors");
                        }}
                        className="text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generationMode === 'transformation' ? 'Different Style' : 'New Variation'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = message.image_url!;
                          link.download = `design-${Date.now()}.png`;
                          link.click();
                        }}
                        className="text-xs"
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                  
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator when AI is responding */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="max-w-md px-4 py-3 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* BOM Generation Button */}
            {user && currentConversationId && currentProjectId && !currentBomId && (
              <div className="p-4 border-t border-b border-border/50 bg-card/50">
                <Button
                  onClick={handleGenerateBOM}
                  disabled={bomGenerating}
                  className="w-full"
                  variant="outline"
                >
                  {bomGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Bill of Materials...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Generate Bill of Materials
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* BOM Success Message */}
            {currentBomId && (
              <div className="p-4 border-t border-border/50 bg-primary/5">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Bill of Materials Generated! 🎉</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your BOM is ready. View it in the Materials tab to search for products and create your shopping list.
                    </p>
                    <Button
                      onClick={() => {
                        // Navigate to materials tab if in ProjectDetail
                        const materialsTab = document.querySelector('[value="materials"]') as HTMLButtonElement;
                        if (materialsTab) {
                          materialsTab.click();
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View in Materials Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Input */}
            <div className="p-6 border-t border-border/50 bg-card">
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 rounded-lg border"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={isLoading ? "AI is responding..." : "Describe your project or upload an image..."}
                  className="flex-1 h-12 text-base"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend}
                  variant="hero"
                  size="lg"
                  className="px-6"
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
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
    </div>
  );
};

export default AIChat;

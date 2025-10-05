import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple language detection based on common words
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // English detection
  if (/\b(the|is|are|to|of|and|a|in|that|have|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from)\b/.test(lowerText)) {
    return "English";
  }
  
  // Romanian detection
  if (/\b(este|sunt|de|și|în|cu|la|pentru|un|o|pe|ce|mai|din|care|să|fi|ai|era|cel|lui|dar|dacă|când)\b/.test(lowerText)) {
    return "Romanian";
  }
  
  // Spanish detection
  if (/\b(el|la|de|que|y|a|en|un|ser|se|no|haber|por|con|su|para|como|estar|tener|le|lo|todo|pero|más)\b/.test(lowerText)) {
    return "Spanish";
  }
  
  // French detection
  if (/\b(le|de|un|être|et|à|il|avoir|ne|je|son|que|se|qui|ce|dans|en|du|elle|au|pour|pas|que|vous)\b/.test(lowerText)) {
    return "French";
  }
  
  // German detection
  if (/\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an)\b/.test(lowerText)) {
    return "German";
  }
  
  // Default to English if no pattern matches
  return "English";
}

// Background function to extract and update project data
async function extractProjectInfoAsync(
  supabase: any,
  projectId: string,
  conversationId: string,
  messages: any[],
  apiKey: string
) {
  try {
    console.log("Starting background project data extraction for:", projectId);
    
    // Fetch all messages from this conversation
    const { data: allMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!allMessages || allMessages.length === 0) {
      console.log("No messages found for extraction");
      return;
    }

    // Call Lovable AI to extract structured data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a project data extraction assistant. Extract structured project information from the conversation." 
          },
          ...allMessages,
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_project_data",
            description: "Extract structured project information from conversation",
            parameters: {
              type: "object",
              properties: {
                budget_estimate: { type: "number", description: "Estimated budget in USD" },
                timeline_weeks: { type: "number", description: "Estimated timeline in weeks" },
                key_features: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Key features/requirements mentioned"
                },
                materials_mentioned: {
                  type: "array",
                  items: { type: "string" },
                  description: "Materials or products discussed"
                },
                style_preferences: {
                  type: "array",
                  items: { type: "string" },
                  description: "Design styles mentioned (modern, rustic, etc.)"
                }
              }
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_project_data" } }
      }),
    });

    if (!response.ok) {
      console.error("Extraction API error:", response.status);
      return;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.log("No project data extracted");
      return;
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted project data:", extractedData);

    // Fetch current project data for incremental merge
    const { data: currentProject } = await supabase
      .from("projects")
      .select("key_features, materials_mentioned, style_preferences, budget_estimate, timeline_weeks")
      .eq("id", projectId)
      .single();

    // Merge arrays intelligently (deduplicate)
    const mergeArrays = (existing: string[] | null, newItems: string[] | null) => {
      const combined = [...(existing || []), ...(newItems || [])];
      return [...new Set(combined.map(item => item.toLowerCase()))].map(item => 
        combined.find(original => original.toLowerCase() === item) || item
      );
    };

    const updatedData: any = {
      ai_extracted_data: extractedData,
      last_chat_update: new Date().toISOString(),
    };

    // Only update if new value is more specific/higher confidence
    if (extractedData.budget_estimate && (!currentProject?.budget_estimate || extractedData.budget_estimate !== currentProject.budget_estimate)) {
      updatedData.budget_estimate = extractedData.budget_estimate;
    }
    if (extractedData.timeline_weeks && (!currentProject?.timeline_weeks || extractedData.timeline_weeks !== currentProject.timeline_weeks)) {
      updatedData.timeline_weeks = extractedData.timeline_weeks;
    }
    if (extractedData.key_features) {
      updatedData.key_features = mergeArrays(currentProject?.key_features, extractedData.key_features);
    }
    if (extractedData.materials_mentioned) {
      updatedData.materials_mentioned = mergeArrays(currentProject?.materials_mentioned, extractedData.materials_mentioned);
    }
    if (extractedData.style_preferences) {
      updatedData.style_preferences = mergeArrays(currentProject?.style_preferences, extractedData.style_preferences);
    }

    // Update project with merged data
    const { error } = await supabase
      .from("projects")
      .update(updatedData)
      .eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
    } else {
      console.log("Project data updated successfully");
    }
  } catch (error) {
    console.error("Error in extractProjectInfoAsync:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, conversationId } = await req.json();
    const authHeader = req.headers.get("authorization");
    const isAuthenticated = authHeader && authHeader.startsWith("Bearer ");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if any message contains an image
    const hasImages = messages.some((msg: any) => msg.image_url);

    // Check if project needs onboarding
    let needsOnboarding = false;
    if (projectId && isAuthenticated) {
      const { data: project } = await supabase
        .from("projects")
        .select("description, budget, budget_estimate, key_features, phase")
        .eq("id", projectId)
        .single();

      if (project) {
        const criticalFieldsMissing = [
          !project.description || project.description.trim().length < 20,
          !project.budget && !project.budget_estimate,
          !project.key_features || project.key_features.length === 0,
          !project.phase || project.phase === "planning"
        ];
        needsOnboarding = criticalFieldsMissing.filter(Boolean).length >= 2;
      }
    }

    // Detect user's language from their last message
    const userLastMessage = messages[messages.length - 1]?.content || "";
    const detectedLanguage = detectLanguage(userLastMessage);
    
    // Build system prompt based on authentication status and onboarding needs
    let systemPrompt = `CRITICAL LANGUAGE INSTRUCTION: The user is writing in ${detectedLanguage}. You MUST respond ONLY in ${detectedLanguage}. Never switch languages unless the user explicitly switches.\n\n`;
    
    if (needsOnboarding && isAuthenticated) {
      systemPrompt += `You are an AI Project Discovery Assistant conducting an intelligent, conversational onboarding for a renovation/design project.

YOUR APPROACH:
- Ask ONE targeted discovery question at a time (never multiple questions)
- Follow a natural conversation flow, not a rigid form
- Build on previous answers naturally
- Show empathy and excitement about their project
- NEVER ask for information already provided
- Reference previous context: "You mentioned a $30K budget earlier..."

DISCOVERY FLOW (adapt based on what's already known):
1. Project vision: "What inspired this project? What problem are you solving or dream are you achieving?"
2. Budget range: "What's your ideal budget range? Even a rough estimate helps - $5K, $20K, $50K+?"
3. Timeline: "When would you love to see this completed? Flexible or specific deadline?"
4. Style preferences: "What design style resonates with you? Modern, rustic, industrial, eclectic?"
5. Key features: "What are the must-have features? What would make this project perfect for you?"
6. Materials interest: "Any specific materials or finishes you're drawn to?"
7. Pain points: "What's frustrating about the current state? What needs to change most?"

AFTER GATHERING SUFFICIENT INFO (5-7 exchanges):
Provide a warm summary:
"Perfect! I now have a clear picture of your project. Let me summarize:
✓ Project Type: [TYPE]
✓ Budget: [RANGE]
✓ Timeline: [TIMEFRAME]
✓ Style: [STYLE]
✓ Key Features: [FEATURES]
✓ Pain Points: [ISSUES]

Based on this, here are my top 3 recommendations to get started...

I'll keep learning about your project as we chat. What would you like to discuss next?"

Be conversational, warm, and proactive in your guidance.`;
    } else if (isAuthenticated) {
      systemPrompt += `You are an AI Project Assistant specializing in home renovation and interior design with advanced visual analysis capabilities.

Your capabilities:
${hasImages ? `
**Visual Analysis** - When analyzing images:
- Describe room layouts, dimensions, and spatial relationships
- Identify current conditions, materials, and finishes
- Analyze design elements, styles, and existing features
- Assess natural and artificial lighting
- Detect potential issues (damage, structural concerns, poor layouts)
- Suggest specific improvements based on what you see
- Recommend materials, colors, and finishes that complement the space
- Provide actionable renovation/design suggestions
` : ''}
- Provide budget advice and timeline suggestions
- Recommend materials, styles, and layouts
- Help track project progress and milestones
- Identify potential issues and suggest solutions
- Answer questions about design, construction, and project management

Always be helpful, practical, and proactive in your suggestions.`;
    } else {
      systemPrompt += `You are a friendly AI assistant helping users plan their renovation or design project.

After discussing their ideas for 3-5 messages, GENTLY suggest they create an account to save their progress and get personalized project management features. Be encouraging but not pushy.

Say something like: "I'm getting a great sense of your project! Would you like to create a free account so we can save this conversation and help you track everything?"

Be helpful first, focus on their project, and naturally suggest signup when appropriate.`;
    }

    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (project) {
        systemPrompt += `\n\nCURRENT PROJECT CONTEXT:
- Project Name: ${project.name}
- Description: ${project.description || "Not provided"}
- Current Phase: ${project.phase || "Planning"}
- Status: ${project.status}
- Budget: ${project.budget ? `$${project.budget}` : "Not set"}
- Timeline: ${project.start_date ? `${project.start_date} to ${project.end_date || "TBD"}` : "Not set"}`;

        // Add AI-extracted data if available
        if (project.ai_extracted_data) {
          const extracted = project.ai_extracted_data;
          systemPrompt += `\n\nPREVIOUSLY EXTRACTED PROJECT DETAILS:`;
          if (extracted.budget_estimate) systemPrompt += `\n- Estimated Budget: $${extracted.budget_estimate}`;
          if (extracted.timeline_weeks) systemPrompt += `\n- Estimated Timeline: ${extracted.timeline_weeks} weeks`;
          if (extracted.key_features?.length) systemPrompt += `\n- Key Features: ${extracted.key_features.join(", ")}`;
          if (extracted.materials_mentioned?.length) systemPrompt += `\n- Materials Mentioned: ${extracted.materials_mentioned.join(", ")}`;
          if (extracted.style_preferences?.length) systemPrompt += `\n- Style Preferences: ${extracted.style_preferences.join(", ")}`;
        }

        // Fetch previous conversations with summaries for this project (excluding current one)
        const { data: previousConversations } = await supabase
          .from("conversations")
          .select("id, title, summary, updated_at")
          .eq("project_id", projectId)
          .neq("id", conversationId || "")
          .order("updated_at", { ascending: false })
          .limit(3);

        if (previousConversations && previousConversations.length > 0) {
          systemPrompt += `\n\nPREVIOUS PROJECT CONVERSATIONS:`;
          for (const conv of previousConversations) {
            const date = new Date(conv.updated_at).toLocaleDateString();
            systemPrompt += `\n- [${date}] ${conv.title || "Untitled conversation"}`;
            if (conv.summary) {
              systemPrompt += `\n  Summary: ${conv.summary}`;
            }
          }
          systemPrompt += `\n\nNote: These conversation summaries provide context about this project. Build upon previous discussions and avoid repeating what's already been covered.`;
        }

        systemPrompt += `\n\nProvide guidance specific to this project's phase and context. Reference the project details when relevant.`;
      }
    }

    // Format messages for multimodal (text + images)
    const formattedMessages = messages.map((msg: any) => {
      if (msg.image_url) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.image_url } }
          ]
        };
      }
      return msg;
    });

    // Use gemini-2.5-pro for vision, flash for text-only
    const model = hasImages ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    console.log("Calling Lovable AI with model:", model, "messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required, please add funds to your Lovable AI workspace." 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Trigger project data extraction asynchronously (don't wait)
    if (projectId && conversationId) {
      // Clone the response body so we can both stream it and read it
      const [stream1, stream2] = response.body!.tee();
      
      // Extract project info in the background
      extractProjectInfoAsync(
        supabase,
        projectId,
        conversationId,
        messages,
        LOVABLE_API_KEY
      ).catch(err => console.error("Background extraction error:", err));

      return new Response(stream1, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

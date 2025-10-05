import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Improved language detection with scoring system
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Count matches for each language (more specific words = higher score)
  const scores: Record<string, number> = {
    Romanian: 0,
    English: 0,
    Spanish: 0,
    French: 0,
    German: 0,
  };
  
  // Romanian detection (specific words that are unlikely in other languages)
  const romanianWords = [
    'salut', 'bună', 'mulțumesc', 'vă', 'aș', 'avea', 'nevoie', 'vreau', 'doresc',
    'privind', 'despre', 'faianta', 'backsplash', 'bucătărie', 'baie', 
    'este', 'sunt', 'își', 'să', 'dacă', 'când', 'pentru', 'mai', 'foarte'
  ];
  romanianWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      scores.Romanian += 2; // Higher weight for specific words
    }
  });
  
  // English detection (common but less specific)
  const englishWords = ['hello', 'thanks', 'please', 'would', 'need', 'want', 'about', 'kitchen', 'bathroom', 'tile', 'the', 'have'];
  englishWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      scores.English += 1;
    }
  });
  
  // Spanish detection
  const spanishWords = ['hola', 'gracias', 'quiero', 'necesito', 'cocina', 'baño', 'azulejo', 'el', 'la', 'que'];
  spanishWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      scores.Spanish += 1;
    }
  });
  
  // French detection
  const frenchWords = ['bonjour', 'merci', 'veux', 'besoin', 'cuisine', 'salle', 'carrelage', 'le', 'de', 'que'];
  frenchWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      scores.French += 1;
    }
  });
  
  // German detection
  const germanWords = ['hallo', 'danke', 'brauche', 'möchte', 'küche', 'bad', 'fliese', 'der', 'die', 'das'];
  germanWords.forEach(word => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      scores.German += 1;
    }
  });
  
  // Find the language with the highest score
  let maxScore = 0;
  let detectedLang = "English"; // default
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  console.log("Language detection scores:", scores, "-> Detected:", detectedLang);
  return detectedLang;
}

function shouldGenerateTransformation(message: string): boolean {
  const transformationKeywords = [
    // English
    'transform', 'change', 'modernize', 'renovate', 'simulate',
    'show me', 'different', 'variation', 'makeover', 'redesign',
    'update', 'upgrade', 'replace', 'swap', 'try', 'what if',
    'how would', 'can you show', 'visualize', 'imagine',
    // Romanian
    'transformă', 'schimbă', 'modernizează', 'renovează', 'simulează',
    'arată-mi', 'diferit', 'variație', 'reamenajare', 'redesign',
    'actualizează', 'îmbunătățește', 'înlocuiește', 'încearcă',
    'cum ar', 'poți să arăți', 'vizualizează',
    // Spanish
    'transformar', 'cambiar', 'modernizar', 'renovar', 'simular',
    'muéstrame', 'diferente', 'variación', 'rediseñar',
    // French
    'transformer', 'changer', 'moderniser', 'rénover', 'simuler',
    'montre-moi', 'différent', 'variation', 'réaménager',
    // German
    'transformieren', 'ändern', 'modernisieren', 'renovieren',
    'zeig mir', 'anders', 'variation', 'umgestalten'
  ];
  const lowerMessage = message.toLowerCase();
  return transformationKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to detect text-to-image generation requests
function shouldGenerateFromScratch(message: string, hasImages: boolean): boolean {
  // Only trigger if NO images in conversation (text-to-image mode)
  if (hasImages) return false;
  
  const generationKeywords = [
    'generate', 'create', 'design', 'show me', 'make me',
    'build', 'imagine', 'visualize', 'example of', 'what would',
    'can you create', 'can you design', 'can you show', 'can you generate'
  ];
  
  const spaceKeywords = [
    'kitchen', 'bedroom', 'bathroom', 'living room', 'office',
    'dining room', 'basement', 'garage', 'patio', 'space',
    'room', 'area', 'interior', 'home'
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasGenerationIntent = generationKeywords.some(k => lowerMessage.includes(k));
  const hasSpaceContext = spaceKeywords.some(k => lowerMessage.includes(k));
  
  return hasGenerationIntent && hasSpaceContext;
}

// Helper function to fetch and convert images to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    console.log('Fetching image for base64 conversion:', imageUrl.substring(0, 100) + '...');
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('Image successfully converted to base64, size:', base64Image.length, 'mime:', mimeType);
    return base64DataUrl;
  } catch (error) {
    console.error('Error fetching/converting image to base64:', error);
    return null;
  }
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
    let systemPrompt = `🔴 CRITICAL LANGUAGE INSTRUCTION 🔴
YOU MUST RESPOND ONLY IN ${detectedLanguage.toUpperCase()}.
The user wrote their message in ${detectedLanguage}. YOU MUST REPLY IN ${detectedLanguage}.
DO NOT use English if the user writes in Romanian.
DO NOT use Romanian if the user writes in English.
MATCH THE USER'S LANGUAGE EXACTLY.

`;
    
    if (needsOnboarding && isAuthenticated) {
      systemPrompt += `You are an AI Project Discovery Assistant for renovation projects.

APPROACH:
- Ask ONE question at a time
- Be conversational and warm, not formal
- Build on previous answers
- Keep responses under 3 sentences until you have enough info

GATHER (in order, skip if already known):
1. What inspired this project?
2. Rough budget range?
3. Timeline flexibility?
4. Style preference?
5. Must-have features?

AFTER 4-5 EXCHANGES:
Summarize briefly in bullet points and ask: "Ready to start planning specifics?"

Be warm but concise.`;
    } else if (isAuthenticated) {
      systemPrompt += `You are a concise AI Project Assistant for home renovation and interior design.

CORE PRINCIPLES:
✓ Be brief, direct, and action-oriented
✓ Ask only 1 question at a time, only if critical info is missing
✓ Prioritize helping over explaining
✓ Use bullet points for lists
✓ Avoid lengthy preambles

WHEN USERS UPLOAD IMAGES:
${hasImages ? `
- Briefly describe what you see (2-3 sentences max)
- Ask 1 clarifying question if needed: "What would you like to change?"
- Wait for their answer before providing suggestions
` : ''}

WHEN GENERATING DESIGNS:
- After user provides basic requirements (space type + style OR uploaded image), offer to generate
- Use "GENERATE_IMAGE:" marker with detailed prompt
- Don't wait for excessive details - generate, then iterate

BUDGET & MATERIALS:
- Only discuss if user asks or if generating BOM
- Be practical, not theoretical

AVOID:
✗ Long explanations of design theory
✗ Multiple questions in one response
✗ Generating proposals without enough context (wait for user to clarify)
✗ Repeating information the user already provided

Be helpful, friendly, and efficient. Get to the point.`;
    } else {
      systemPrompt += `You are a friendly AI assistant for renovation projects.

Be brief and helpful. After 2-3 helpful exchanges, suggest: 
"Create a free account to save this conversation and track your project?"

Focus on their project first.

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

    // Format messages for multimodal (text + images) - with base64 conversion
    const formattedMessages = await Promise.all(messages.map(async (msg: any) => {
      if (msg.image_url) {
        console.log('Processing image message:', {
          hasImageUrl: !!msg.image_url,
          imageUrlPrefix: msg.image_url?.substring(0, 100),
          contentLength: msg.content?.length,
          isSignedUrl: msg.image_url?.includes('token=')
        });
        
        // Fetch and convert image to base64 for reliable AI processing
        const base64Image = await fetchImageAsBase64(msg.image_url);
        
        if (!base64Image) {
          console.error('Failed to convert image to base64, sending text-only message');
          // Return text-only message if image conversion fails
          return { role: msg.role, content: msg.content };
        }
        
        console.log('Using base64 image data for AI processing');
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { 
              type: "image_url", 
              image_url: { 
                url: base64Image, // Use base64 data URL instead of signed URL
                detail: 'high' // Request high detail for better analysis
              } 
            }
          ]
        };
      }
      return msg;
    }));

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
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, {
        status: response.status,
        error: errorText,
        hasImage: hasImages,
        model: model
      });
      
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
      
      // Specific error for image extraction failures
      if (response.status === 400 && errorText.includes('Failed to extract')) {
        console.error('Image extraction failed - possible issues: URL not accessible, invalid format, or corrupted image');
        return new Response(
          JSON.stringify({ 
            error: "Failed to process image. Please ensure the image is accessible and try uploading a JPG or PNG format.",
            details: "Image URL may not be accessible to the AI service"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "AI gateway error",
          details: errorText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine generation modes
    const lastUserMessage = messages[messages.length - 1];
    const hasRecentImage = messages.slice(-3).some((m: any) => m.image_url);
    const shouldGenerateText = !hasRecentImage && shouldGenerateFromScratch(lastUserMessage.content, false);
    const shouldTransform = hasRecentImage && shouldGenerateTransformation(lastUserMessage.content);

    // Handle project extraction and image generation in background
    if (projectId && conversationId) {
      // Clone the response stream: one for client, one for background processing
      const [streamClient, streamBackground] = response.body!.tee();
      
      // 1. Extract project info in background
      extractProjectInfoAsync(
        supabase,
        projectId,
        conversationId,
        messages,
        LOVABLE_API_KEY
      ).catch(err => console.error("Background extraction error:", err));

      // 2. Process AI response stream for image generation markers
      (async () => {
        try {
          const reader = streamBackground.getReader();
          const decoder = new TextDecoder();
          let assistantTextBuffer = '';
          let textBuffer = '';
          
          // Parse SSE stream line-by-line to extract assistant content
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            textBuffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE lines
            let newlineIndex: number;
            while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
              let line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);
              
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantTextBuffer += content;
                }
              } catch {
                // Incomplete JSON, will retry on next iteration
              }
            }
          }
          
          console.log('AI response buffer length:', assistantTextBuffer.length);
          console.log('Checking for GENERATE_IMAGE marker...');
          
          // Check if AI included GENERATE_IMAGE marker
          const hasGenerateMarker = assistantTextBuffer.includes('GENERATE_IMAGE:');
          console.log('GENERATE_IMAGE marker found:', hasGenerateMarker);
          
          let generationPrompt: string | null = null;
          let originalImageUrl: string | null = null;
          
          if (hasGenerateMarker) {
            // Extract generation prompt after GENERATE_IMAGE:
            const markerMatch = assistantTextBuffer.match(/GENERATE_IMAGE:\s*(.+?)(?=\n\n|\n$|$)/s);
            if (markerMatch) {
              generationPrompt = markerMatch[1].trim();
              console.log('Extracted generation prompt from marker:', generationPrompt.substring(0, 100) + '...');
              
              // Check if there's a recent image for transformation mode
              for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
                if (messages[i].image_url) {
                  originalImageUrl = messages[i].image_url;
                  console.log('Found recent image for transformation mode');
                  break;
                }
              }
            }
          } else if (shouldTransform) {
            // Fallback: if no marker but transformation intent detected
            console.log('No GENERATE_IMAGE marker, but transformation intent detected - using fallback');
            generationPrompt = lastUserMessage.content;
            
            // Find recent image
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].image_url) {
                originalImageUrl = messages[i].image_url;
                break;
              }
            }
          }
          
          // Generate image if we have a prompt
          if (generationPrompt) {
            console.log('Initiating image generation:', {
              mode: originalImageUrl ? 'transformation' : 'text-to-image',
              promptLength: generationPrompt.length
            });
            
            // Get project data for context
            const { data: projectData } = await supabase
              .from("projects")
              .select("name, budget, style_preferences")
              .eq("id", projectId)
              .maybeSingle();
            
            const imageGenResponse = await fetch(`${supabaseUrl}/functions/v1/generate-renovation-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                originalImageUrl: originalImageUrl || undefined,
                transformationRequest: generationPrompt,
                projectContext: projectData,
              }),
            });

            if (imageGenResponse.ok) {
              const { generatedImageUrl } = await imageGenResponse.json();
              console.log('Image generation successful:', originalImageUrl ? 'transformation' : 'text-to-image');

              // Save generated image as new message
              const messageContent = originalImageUrl
                ? '✨ Here\'s your renovation transformation! This shows how your space could look with the changes we discussed. Would you like to try a different style or make adjustments?'
                : '✨ Here\'s your custom design visualization! This photorealistic rendering brings your vision to life. Would you like me to generate variations with different styles, colors, or layouts?';
                
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: messageContent,
                image_url: generatedImageUrl
              });

              console.log('Generated image saved to conversation');
            } else {
              const errorText = await imageGenResponse.text();
              console.error('Image generation failed:', imageGenResponse.status, errorText);
              
              // Inform user about the failure
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: 'I apologize, but I encountered an issue generating the image. Please try again or rephrase your request with more specific details about the design you\'d like to see.'
              });
            }
          } else {
            console.log('No image generation triggered - no marker or transformation intent');
          }
        } catch (error) {
          console.error('Error in background image generation:', error);
        }
      })().catch(err => console.error('Background processing error:', err));


      // Return the client stream immediately
      return new Response(streamClient, {
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

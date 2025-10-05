import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vendor {
  id: string;
  name: string;
  website_url: string;
  search_url_template: string;
  is_active: boolean;
  priority: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bomItemId, searchQuery } = await req.json();
    console.log('Searching products for BOM item:', bomItemId, 'Query:', searchQuery);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch BOM item details for context
    const { data: bomItem, error: itemError } = await supabase
      .from('bom_items')
      .select('item_name, description, category, unit')
      .eq('id', bomItemId)
      .single();

    if (itemError) throw itemError;

    // Fetch active vendors from database
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (vendorError) throw vendorError;

    if (!vendors || vendors.length === 0) {
      console.log('No active vendors configured');
      return new Response(
        JSON.stringify({ success: true, matchCount: 0, matches: [], message: 'No active vendors configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${vendors.length} active vendors to search`);

    const productMatches = [];

    for (const vendor of vendors) {
      const searchUrl = vendor.search_url_template.replace('{query}', encodeURIComponent(searchQuery));
      
      console.log(`Scraping ${vendor.name}:`, searchUrl);

      try {
        // Call Firecrawl to scrape the search results
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['markdown']
          })
        });

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${vendor.name}:`, await scrapeResponse.text());
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const scrapedContent = scrapeData.data?.markdown || '';
        
        console.log(`Scraped ${vendor.name}, content length:`, scrapedContent.length);

        // Use AI to extract product information from scraped content
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `You are a product extraction expert. Extract up to 5 relevant products from scraped content.
                
Target item: ${bomItem.item_name}
Description: ${bomItem.description || 'N/A'}
Category: ${bomItem.category}
Unit: ${bomItem.unit}

Return products that match this specification.` 
              },
              { 
                role: 'user', 
                content: `Extract products from this ${vendor.name} search results:\n\n${scrapedContent.slice(0, 4000)}` 
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'extract_products',
                description: 'Extract product information from scraped content',
                parameters: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          product_name: { type: 'string' },
                          price: { type: 'number' },
                          product_url: { type: 'string' },
                          in_stock: { type: 'boolean' },
                          match_score: { 
                            type: 'number',
                            description: 'Match quality from 0-100'
                          }
                        },
                        required: ['product_name', 'price', 'match_score'],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ['products'],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'extract_products' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const extractedData = JSON.parse(toolCall.function.arguments);
            const products = extractedData.products || [];
            
            console.log(`Extracted ${products.length} products from ${vendor.name}`);

            productMatches.push(...products.map((p: any) => ({
              bom_item_id: bomItemId,
              product_name: p.product_name,
              product_url: p.product_url || searchUrl,
              price: p.price,
              vendor: vendor.name,
              in_stock: p.in_stock !== false,
              match_score: p.match_score || 50,
              product_details: { raw_data: p }
            })));
          }
        }
      } catch (vendorError) {
        console.error(`Error scraping ${vendor.name}:`, vendorError);
      }
    }

    // Insert product matches into database
    if (productMatches.length > 0) {
      const { error: insertError } = await supabase
        .from('product_matches')
        .insert(productMatches);

      if (insertError) throw insertError;
      console.log('Inserted', productMatches.length, 'product matches');
    }

    return new Response(
      JSON.stringify({
        success: true,
        matchCount: productMatches.length,
        matches: productMatches
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to search products' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
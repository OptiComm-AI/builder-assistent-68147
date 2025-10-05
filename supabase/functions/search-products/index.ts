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
      const { bomItemId, searchQuery, language = 'en' } = await req.json();
      console.log('=== PRODUCT SEARCH START ===');
      console.log('BOM Item ID:', bomItemId);
      console.log('Search Query:', searchQuery);
      console.log('Language:', language);

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
      console.log('❌ No active vendors configured');
      return new Response(
        JSON.stringify({ success: false, matchCount: 0, matches: [], error: 'No active vendors configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓ Found ${vendors.length} active vendors to search:`, vendors.map(v => v.name));

    const productMatches = [];

    for (const vendor of vendors) {
      const searchUrl = vendor.search_url_template.replace('{query}', encodeURIComponent(searchQuery));
      
      console.log(`\n--- Searching ${vendor.name} ---`);
      console.log('URL:', searchUrl);

      try {
        // Call Firecrawl to scrape the search results with structured formats
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['markdown', 'html', 'links']
          })
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.error(`❌ Firecrawl error for ${vendor.name}:`, scrapeResponse.status, errorText);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const scrapedContent = scrapeData.data?.markdown || '';
        const htmlContent = scrapeData.data?.html || '';
        
        console.log(`✓ Scraped ${vendor.name}`);
        console.log('  Markdown length:', scrapedContent.length);
        console.log('  HTML length:', htmlContent.length);
        console.log('  Content preview:', scrapedContent.slice(0, 200));

        // Use AI to extract product information from scraped content
        const systemPrompt = language === 'ro'
          ? `Ești un expert în extragerea de informații despre produse din rezultatele căutărilor pe site-uri de vânzări online.

Articol căutat: ${bomItem.item_name}
Descriere: ${bomItem.description || 'N/A'}
Categorie: ${bomItem.category}
Unitate: ${bomItem.unit}

SARCINA TA:
1. Analizează conținutul scrapat de pe ${vendor.name}
2. Identifică produsele individuale care se potrivesc articolului căutat
3. Extrage EXACT aceste detalii pentru fiecare produs:
   - Numele produsului (așa cum apare pe site)
   - Prețul în RON (doar numărul, fără "RON" sau alte simboluri)
   - URL-ul produsului (link complet către pagina produsului)
   - URL-ul imaginii produsului (dacă este disponibil)
   - Disponibilitatea în stoc (true/false)
   - Scorul de potrivire (0-100, unde 100 = potrivire perfectă)

4. Returnează maxim 5 produse, ordonate după scorul de potrivire

IMPORTANT: 
- Dacă nu găsești produse clare în conținut, returnează un array gol
- Asigură-te că prețurile sunt numere valide
- URL-urile trebuie să înceapă cu http:// sau https://`
          : `You are an expert at extracting product information from online store search results.

Target item: ${bomItem.item_name}
Description: ${bomItem.description || 'N/A'}
Category: ${bomItem.category}
Unit: ${bomItem.unit}

YOUR TASK:
1. Analyze the scraped content from ${vendor.name}
2. Identify individual products that match the target item
3. Extract EXACTLY these details for each product:
   - Product name (as shown on the site)
   - Price in local currency (just the number, no currency symbols)
   - Product URL (full link to product page)
   - Product image URL (if available)
   - Stock availability (true/false)
   - Match score (0-100, where 100 = perfect match)

4. Return up to 5 products, ordered by match score

IMPORTANT:
- If you can't find clear products in the content, return an empty array
- Ensure prices are valid numbers
- URLs must start with http:// or https://`;

        const contentToAnalyze = scrapedContent.slice(0, 6000);
        const userPrompt = language === 'ro'
          ? `Analizează următorul conținut scrapat de pe ${vendor.name} și extrage produsele:\n\n${contentToAnalyze}`
          : `Analyze this scraped content from ${vendor.name} and extract products:\n\n${contentToAnalyze}`;
        
        console.log('  Sending to AI for extraction...');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
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
                          image_url: { type: 'string', description: 'Product image URL if available' },
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
          console.log('  AI Response received');
          
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const extractedData = JSON.parse(toolCall.function.arguments);
            const products = extractedData.products || [];
            
            console.log(`  ✓ Extracted ${products.length} products from ${vendor.name}`);
            if (products.length > 0) {
              console.log('  Sample product:', products[0].product_name, '-', products[0].price);
            }

            productMatches.push(...products.map((p: any) => ({
              bom_item_id: bomItemId,
              product_name: p.product_name,
              product_url: p.product_url || searchUrl,
              image_url: p.image_url || null,
              price: p.price,
              vendor: vendor.name,
              in_stock: p.in_stock !== false,
              match_score: p.match_score || 50,
              product_details: { raw_data: p }
            })));
          } else {
            console.log('  ⚠ No tool call in AI response');
          }
        } else {
          const errorText = await aiResponse.text();
          console.error(`  ❌ AI extraction failed for ${vendor.name}:`, aiResponse.status, errorText);
        }
      } catch (vendorError) {
        console.error(`❌ Error processing ${vendor.name}:`, vendorError);
      }
    }

    // Insert product matches into database
    console.log(`\n=== SEARCH COMPLETE ===`);
    console.log(`Total products found: ${productMatches.length}`);
    
    if (productMatches.length > 0) {
      const { error: insertError } = await supabase
        .from('product_matches')
        .insert(productMatches);

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw insertError;
      }
      console.log('✓ Inserted', productMatches.length, 'product matches into database');
    } else {
      console.log('⚠ No products found from any vendor');
    }

    return new Response(
      JSON.stringify({
        success: productMatches.length > 0,
        matchCount: productMatches.length,
        matches: productMatches,
        message: productMatches.length === 0 ? 'No products found from vendors. Try adjusting your search query.' : undefined
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
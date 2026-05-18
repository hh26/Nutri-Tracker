// /api/food-search.js
// 1. We are back to using 'import' to make Vite and Vercel happy!
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.query;
    const authHeader = req.headers.authorization;

    if (!query) return res.status(400).json({ error: 'Query parameter is required' });
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

    // 2. Check if Supabase keys exist
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error("SERVER MISCONFIGURATION: Missing Supabase Environment Variables");
    }

    // 3. Initialize Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL, 
      process.env.VITE_SUPABASE_ANON_KEY 
    );

    // 4. Verify User Token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized user', details: authError });
    }

    // 5. Check Edamam Keys
    if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_APP_KEY) {
      throw new Error("SERVER MISCONFIGURATION: Missing Edamam Environment Variables");
    }

    // 6. Fetch from Edamam (X-RAY DEBUG VERSION)
    const edamamUrl = `https://api.edamam.com/api/food-database/v2/parser?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}`;
    
    console.log("TRYING TO FETCH:", edamamUrl); 
    
    const response = await fetch(edamamUrl);
    const rawText = await response.text();
    
    if (rawText.startsWith('<')) {
      console.error("EDAMAM RETURNED HTML INSTEAD OF JSON! First 100 chars:", rawText.substring(0, 100));
      return res.status(502).json({ 
        error: 'Edamam returned an invalid HTML response', 
        url_attempted: edamamUrl 
      });
    }

    const data = JSON.parse(rawText);
    return res.status(200).json(data);

  } catch (error) {
    console.error('CRITICAL BACKEND ERROR:', error.message);
    return res.status(500).json({ 
      error: 'The server encountered an error.', 
      exact_cause: error.message 
    });
  }
}
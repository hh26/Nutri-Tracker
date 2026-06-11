// api/smart-voice.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  if (req.headers['authorization'] !== `Bearer ${process.env.SIRI_WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { text, userId } = req.body; // Pass userId from Siri to track who is logging
    if (!text) return res.status(400).json({ error: 'No text provided' });
    if (!userId) return res.status(400).json({ error: 'No user ID provided' });

    // 1. Let Gemini figure out what the user said
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Analyze this user voice input for a nutrition tracker: "${text}"
      
      Extract into a raw JSON object:
      - "food" (string, the name of the food. null if not mentioned)
      - "quantity" (number. null if completely unknown)
      - "measure" (string. e.g., grams, slices, unit. null if unknown)
      - "meal" (string. Must be exactly "Breakfast", "Lunch", "Snacks", or "Dinner". null if not mentioned)

      Return ONLY the raw JSON object. Do not include markdown tags.
    `;

    const result = await model.generateContent(prompt);
    let parsedText = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
    const data = JSON.parse(parsedText);

    // 2. The Server Brain decides what missing info Siri needs to prompt for
    if (!data.food) {
      return res.status(200).json({ status: 'incomplete', question: 'What food did you eat?' });
    }
    if (!data.quantity) {
      return res.status(200).json({ status: 'incomplete', question: `How much ${data.food} did you have?` });
    }
    if (!data.meal) {
      return res.status(200).json({ status: 'incomplete', question: `Which meal of the day is the ${data.food} for?` });
    }

    // Default the measure to grams if it's missing but we have a quantity
    const finalMeasure = data.measure || 'grams';

    // 3. Call the Edamam API to find the real food item and its nutrients
    const edamamUrl = `https://api.edamam.com/api/food-database/v2/parser?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(data.food)}`;
    
    const edamamRes = await fetch(edamamUrl);
    if (!edamamRes.ok) throw new Error("Failed to fetch from Edamam API");
    
    const edamamData = await edamamRes.json();
    const matchedFood = edamamData.hints?.[0]?.food;

    if (!matchedFood) {
      return res.status(200).json({ 
        status: 'incomplete', 
        question: `I couldn't find "${data.food}" in the food database. Could you try saying the food name differently?` 
      });
    }

    // 4. Calculate the Macros based on the unit/weight
    // If the unit is grams, we evaluate based on Edamam's standard 100g serving size.
    // Otherwise, we calculate per-unit multiplier.
    let ratio = data.quantity;
    if (finalMeasure.toLowerCase() === 'grams' || finalMeasure.toLowerCase() === 'g') {
      ratio = data.quantity / 100;
    }

    const calculatedNutrients = {
      calories: Math.round((matchedFood.nutrients.ENERC_KCAL || 0) * ratio),
      protein: Math.round(((matchedFood.nutrients.PROCNT || 0) * ratio) * 10) / 10,
      carbs: Math.round(((matchedFood.nutrients.CHOCDF || 0) * ratio) * 10) / 10,
      fats: Math.round(((matchedFood.nutrients.FAT || 0) * ratio) * 10) / 10,
    };

    // 5. Log directly to your Supabase meals table
    const { error: supabaseError } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        mealType: data.meal,
        foodName: matchedFood.label, // Saves the "Official" name from Edamam (e.g., "Fried Egg")
        calories: calculatedNutrients.calories,
        protein: calculatedNutrients.protein,
        carbs: calculatedNutrients.carbs,
        fats: calculatedNutrients.fats,
        inputAmount: data.quantity,
        inputMetric: finalMeasure
      });

    if (supabaseError) throw supabaseError;

    // 6. Respond back to Siri with success
    return res.status(200).json({ 
      status: 'success', 
      message: `Logged ${data.quantity} ${finalMeasure === 'unit' ? '' : finalMeasure} of ${matchedFood.label} to ${data.meal}.` 
    });

  } catch (error) {
    console.error("Smart Voice Integration Error:", error);
    return res.status(500).json({ error: 'Server error tracking meal.' });
  }
}
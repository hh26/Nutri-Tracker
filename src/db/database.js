import { supabase } from './supabase';

// ==========================================
// AUTHENTICATION HELPER
// ==========================================
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be logged in to save data.");
  return user.id;
}

export async function logMeal(mealData) {
  try {
    const userId = await getCurrentUser();
    
    // Send data to Supabase instead of Dexie!
    const { error } = await supabase
      .from('logs')
      .insert([{ 
        user_id: userId, // Attach the data to this specific user
        ...mealData 
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to log meal:", error);
  }
}

export async function getDailyLogs(date) {
  try {
    const userId = await getCurrentUser();
    
    // Fetch only the logs for this user, on this specific date
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return [];
  }
}

export async function deleteMeal(id) {
  try {
    const userId = await getCurrentUser();
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to delete meal:", error);
  }
}

export async function moveMeal(id, targetMealType) {
  try {
    const userId = await getCurrentUser();
    const { error } = await supabase
      .from('logs')
      .update({ mealType: targetMealType })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to move meal:", error);
  }
}

export async function copyMeal(logData, targetMealType) {
  try {
    const userId = await getCurrentUser();
    
    // Remove the old 'id' and 'created_at' from the copied data so Supabase generates new ones
    const { id, created_at, ...cleanLogData } = logData;

    const { error } = await supabase
      .from('logs')
      .insert([{
        ...cleanLogData,
        user_id: userId,
        mealType: targetMealType
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to copy meal:", error);
  }
}

export async function updateMeal(id, updatedData) {
  try {
    const userId = await getCurrentUser();
    const { error } = await supabase
      .from('logs')
      .update(updatedData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update meal:", error);
  }
}

export async function getWeeklyData(endDate = new Date()) {
  try {
    const userId = await getCurrentUser();

    // 1. Create an array of 7 days ending on the provided endDate
    const sevenDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(endDate);
      d.setDate(d.getDate() - (6 - i)); // Go back 6 days up to the endDate
      return d.toISOString().split('T')[0];
    });

    const startDateStr = sevenDays[0];
    const endDateStr = sevenDays[6];

    // 2. Ask Supabase ONLY for the logs belonging to this user within this exact 7-day window
    const { data: logs, error } = await supabase
      .from('logs')
      .select('date, calories, protein, carbs, fats') // Optimize payload to just what we need
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (error) throw error;

    const safeLogs = logs || [];

    // 3. Group logs by day and sum the macros (exactly like your original UI expects)
    const weeklyStats = sevenDays.map(date => {
      const dayLogs = safeLogs.filter(log => log.date === date);
      
      // Get short day name (e.g., "Mon", "Tue")
      const dateObj = new Date(date + 'T12:00:00Z'); 
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      const totals = dayLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0)
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      return {
        name: dayName,
        fullDate: date, // Keep full date for the UI
        Calories: Math.round(totals.calories),
        Protein: Math.round(totals.protein),
        Carbs: Math.round(totals.carbs),
        Fats: Math.round(totals.fats)
      };
    });

    return weeklyStats;

  } catch (error) {
    console.error("Failed to fetch weekly data:", error);
    
    // Fallback: return an empty 7-day structure so your charts don't crash if offline
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(endDate);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dateObj = new Date(dateStr + 'T12:00:00Z');
      return {
        name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        Calories: 0, Protein: 0, Carbs: 0, Fats: 0
      };
    });
  }
}

export async function saveCombo(name, items, timestamp = new Date().toISOString()) {
  try {
    const userId = await getCurrentUser();
    
    // Calculate total calories AND macros
    const totals = items.reduce((acc, item) => {
      const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
      return {
        calories: acc.calories + (item.calories * ratio),
        protein: acc.protein + (item.protein * ratio),
        carbs: acc.carbs + (item.carbs * ratio),
        fats: acc.fats + (item.fats * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const { error } = await supabase
      .from('combos')
      .insert([{
        user_id: userId,
        name: name,
        items: items,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        isCombo: true,
        created_at: timestamp
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to save combo:", error);
  }
}

export async function getCombos() {
  try {
    const userId = await getCurrentUser();
    const { data, error } = await supabase
      .from('combos')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch combos:", error);
    return [];
  }
}

// Add to the bottom of src/db/database.js

export async function deleteCombo(id) {
  try {
    const userId = await getCurrentUser();
    const { error } = await supabase
      .from('combos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to delete combo:", error);
  }
}

export async function updateCombo(id, name, items, timestamp = new Date().toISOString()) {
  try {
    const userId = await getCurrentUser();
    
    // Calculate total calories AND macros
    const totals = items.reduce((acc, item) => {
      const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
      return {
        calories: acc.calories + (item.calories * ratio),
        protein: acc.protein + (item.protein * ratio),
        carbs: acc.carbs + (item.carbs * ratio),
        fats: acc.fats + (item.fats * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const { error } = await supabase
      .from('combos')
      .update({ 
        name: name, 
        items: items, 
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        created_at: timestamp
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update combo:", error);
  }
}

export async function saveCustomFood(foodItem) {
  try {
    // 1. Get the ID of the person currently logged in
    const userId = await getCurrentUser(); 

    // 2. Send the data to the 'custom_foods' table in Supabase
    const { error } = await supabase
      .from('custom_foods')
      .insert([{
        user_id: userId, // CRITICAL: This ties the food to this specific user
        ...foodItem,
        isCustom: true   // Keep this flag so your search modal still recognizes it!
      }]);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to save custom food:", error);
  }
}

export async function getCustomFoods() {
  try {
    const userId = await getCurrentUser();
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch custom foods:", error);
    return [];
  }
}

export async function deleteCustomFood(id) {
  try {
    const userId = await getCurrentUser();
    
    const { error } = await supabase
      .from('custom_foods')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to delete custom food:", error);
  }
}

export async function updateCustomFood(id, updatedData) {
  try {
    const userId = await getCurrentUser();
    
    const { error } = await supabase
      .from('custom_foods')
      .update(updatedData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update custom food:", error);
  }
}

// Add this anywhere in your database.js file
export async function getRecentLogs(limitCount = 50) {
  try {
    const userId = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) // Gets the newest logs first
      .limit(limitCount);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch recent logs:", error);
    return [];
  }
}

export async function saveUserProfile(profileData) {
  try {
    // 1. Get the currently logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) throw new Error("No user logged in");

    // 2. Upsert (Update or Insert) the data into the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // Links this row to the authenticated user
        ...profileData,
        updated_at: new Date()
      })
      .select();

    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

// Add this to the bottom of src/db/database.js

export async function getUserProfile() {
  try {
    // 1. Get the currently logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return null;

    // 2. Fetch their specific row from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(); // .single() ensures we just get one object back, not an array

    if (error) {
      // PGRST116 means no rows were found (user hasn't set a goal yet), which is fine!
      if (error.code === 'PGRST116') return null; 
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Replace your existing copySelectedMeals in src/db/database.js with this:

export async function copySelectedMeals(selectedLogs, targetDate) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // 1. Prepare the new logs for the target day
    const newLogs = selectedLogs.map(log => {
      // Strip out IDs and timestamps so Supabase can cleanly generate new ones
      const { id, created_at, updated_at, ...rest } = log; 
      
      return {
        ...rest,
        date: targetDate,
      };
    });

    // 2. Insert into the database
    const { data, error: insertError } = await supabase
      .from('logs')
      .insert(newLogs)
      .select();

    if (insertError) {
      // This will print the EXACT reason it failed in your browser console!
      console.error("Supabase Insert Error:", insertError.message); 
      return false;
    }
    
    return true;

  } catch (error) {
    console.error("Error copying selected meals:", error);
    return false;
  }
}

// Add to the bottom of src/db/database.js

export async function getRecentFoodsByMeal(mealType) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return [];

    // 1. Fetch the last 50 items logged for this specific meal
    const { data, error } = await supabase
      .from('logs') // 🚨 Change if your table is named 'logs' or something else
      .select('*') // Get just the food data
      .eq('user_id', user.id)
      .eq('mealType', mealType)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // 2. Remove duplicates (so if you ate eggs 4 days in a row, it only shows once)
    const uniqueFoods = [];
    const seenNames = new Set();
    
    for (const item of data) {
      // Normalize the name (lowercase) to catch exact matches
      const normalizedName = item.foodName.toLowerCase().trim();
      
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        
        uniqueFoods.push({ 
          ...(item.baseFood || { name: item.foodName, calories: item.calories, protein: item.protein, carbs: item.carbs, fats: item.fats }), 
          pastAmount: item.inputAmount,
          pastMetric: item.inputMetric,
          isRecent: true 
        });
        
        // Stop once we have 10 unique items
        if (uniqueFoods.length === 10) break; 
      }
    }
    
    return uniqueFoods;

  } catch (error) {
    console.error("Error fetching recent foods:", error);
    return [];
  }
}
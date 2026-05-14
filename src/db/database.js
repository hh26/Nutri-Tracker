import Dexie from 'dexie';

export const db = new Dexie('TamilNutriTrackDB');

db.version(4).stores({ // Make sure to increase this version number!
  logs: '++id, date, mealType, foodName',
  combos: '++id, name',
  customFoods: '++id, name' // New table for user-added foods
}).upgrade(tx => {
  // Handles upgrades automatically
});

export async function logMeal(entry) {
  try {
    await db.logs.add({
      date: entry.date || new Date().toISOString().split('T')[0],
      mealType: entry.mealType,
      foodName: entry.foodName,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
      // Save original inputs so we can edit them later!
      inputAmount: entry.inputAmount,
      inputMetric: entry.inputMetric,
      baseFood: entry.baseFood, 
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Failed to log meal:", error);
  }
}

export async function deleteMeal(id) {
  await db.logs.delete(id);
}

// NEW: Move an item to a different meal
export async function moveMeal(id, newMealType) {
  await db.logs.update(id, { mealType: newMealType });
}

// NEW: Copy an item to another meal (or same meal)
export async function copyMeal(log, targetMealType) {
  const { id, ...logWithoutId } = log; // Remove old ID so Dexie makes a new one
  logWithoutId.mealType = targetMealType;
  logWithoutId.timestamp = Date.now();
  await db.logs.add(logWithoutId);
}

// Add this to the bottom of src/db/database.js
export async function updateMeal(id, updatedData) {
  try {
    await db.logs.update(id, updatedData);
  } catch (error) {
    console.error("Failed to update meal:", error);
  }
}

export async function getWeeklyData(endDate = new Date()) {
  const logs = await db.logs.toArray();
  
  // Create an array of 7 days ending on the provided endDate
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - (6 - i)); // Go back 6 days up to the endDate
    return d.toISOString().split('T')[0];
  });

  // Group logs by day and sum the macros
  const weeklyStats = sevenDays.map(date => {
    const dayLogs = logs.filter(log => log.date === date);
    
    // Get short day name (e.g., "Mon", "Tue")
    // Note: We use UTC to avoid timezone shifting issues when building the labels
    const dateObj = new Date(date + 'T12:00:00Z'); 
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    const totals = dayLogs.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats
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
}

export async function saveCombo(comboName, foodItems) {
  try {
    // Calculate total macros factoring in whether the user selected 'grams' or 'units'
    const totals = foodItems.reduce((acc, item) => {
      const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
      
      return {
        calories: acc.calories + (item.calories * ratio),
        protein: acc.protein + (item.protein * ratio),
        carbs: acc.carbs + (item.carbs * ratio),
        fats: acc.fats + (item.fats * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    await db.combos.add({
      name: comboName,
      items: foodItems, // Store items with their amount & metric
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      isCombo: true, 
      baseUnit: "1 Combo",
      baseWeight: 1 
    });
  } catch (error) {
    console.error("Failed to save combo:", error);
  }
}

export async function getCombos() {
  return await db.combos.toArray();
}

// Add to the bottom of src/db/database.js

export async function deleteCombo(id) {
  try {
    await db.combos.delete(id);
  } catch (error) {
    console.error("Failed to delete combo:", error);
  }
}

export async function updateCombo(id, comboName, foodItems) {
  try {
    // Recalculate macros just in case quantities were changed during edit
    const totals = foodItems.reduce((acc, item) => {
      const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
      return {
        calories: acc.calories + (item.calories * ratio),
        protein: acc.protein + (item.protein * ratio),
        carbs: acc.carbs + (item.carbs * ratio),
        fats: acc.fats + (item.fats * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    await db.combos.update(id, {
      name: comboName,
      items: foodItems,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats
    });
  } catch (error) {
    console.error("Failed to update combo:", error);
  }
}

export async function saveCustomFood(foodItem) {
  try {
    await db.customFoods.add({
      ...foodItem,
      isCustom: true // Flag to identify it in search
    });
  } catch (error) {
    console.error("Failed to save custom food:", error);
  }
}

export async function getCustomFoods() {
  return await db.customFoods.toArray();
}

export async function deleteCustomFood(id) {
  await db.customFoods.delete(id);
}
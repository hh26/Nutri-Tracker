# Nutri-Tracker

The idea for this project actually started with me wanting to track my weekly calories and protein intake for bulking. I tried using existing apps, but they all had payment locks after a few days. So I thought, why not create one myself. So I sat down and created this app using Google Gemini, built all the features that I wanted with no paywalls.

🍏 Nutri-Tracker
A full-stack, modern web application designed to help users seamlessly track their daily caloric intake, monitor macronutrients, and analyze weekly dietary trends. Built with a focus on a clean, responsive UI and a secure, serverless backend architecture.

✨ Features
Daily Intake Dashboard: Log meals across Breakfast, Lunch, Snacks, and Dinner. View a prominent daily calorie progress ring and macro summaries (Protein, Carbs, Fats).

Smart Goal Calculator: Built-in BMR and TDEE calculator using the Mifflin-St Jeor Equation. Automatically generates personalized daily calorie and protein goals based on user metrics (age, weight, height, gender, activity level).

Weekly Analytics & Trends: Interactive charts visualize weekly calorie and macro trends. Includes visual goal-tracking lines and dynamic bar coloring. Also includes icon to include only the active days so the cheat days which the users ignore to track won't show up on the weekly average.

Edamam Food Database Integration: Search for millions of foods instantly to get accurate nutritional data.

Secure Serverless Proxy: API calls to the Edamam database are routed securely through Vercel Serverless functions to protect API keys and prevent CORS issues.

Cloud Sync & Local Cache: User profiles and meal data are securely saved to a Supabase PostgreSQL database, while utilizing localStorage for lightning-fast, optimistic UI updates.

Meal Management: Easily move items between meals, copy past meals, update quantities, or delete logs.

Custom Foods and Custom Combos: Users can add meals that are not there in the database and track them. They can also create combos of meals which they often have together, and just add it for tracking easily everyday.

🛠️ Tech Stack
Frontend

React (Vite): Fast, modern UI library and build tool.

Tailwind CSS: Utility-first styling for a clean, responsive, and modern aesthetic.

Recharts: Composable charting library for the Analytics dashboard.

React Circular Progressbar: For the daily calorie tracker ring.

Lucide React: Beautiful, consistent iconography.

Backend & Database

Supabase: Open-source Firebase alternative providing PostgreSQL database, Row Level Security (RLS), and user Authentication.

Vercel Serverless Functions: Node.js /api endpoints handling secure third-party API requests and token verification.

External APIs

Edamam Food Database API: For fetching comprehensive food and nutrient data.
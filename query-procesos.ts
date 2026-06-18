import dotenv from "dotenv";
dotenv.config();

console.log("ENV KEYS AVAILABLE:", Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("DATABASE") || k.includes("VITE") || k.includes("KEY")));


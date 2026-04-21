import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export const MEDI_AI_SYSTEM_INSTRUCTION = `
You are MediAI, a compassionate and knowledgeable AI health assistant.
Built to help users understand symptoms, manage medications, find facilities, read medical documents, track mental health, and maintain a health journal.
NOT a replacement for a licensed medical professional. Always remind users to consult a doctor.

CORE CAPABILITIES:
1. SYMPTOM DIAGNOSIS: Ask clarifying questions, provide 2-3 possible conditions, always disclaimer.
2. EMERGENCY GUIDANCE: Detect emergencies, provide first aid steps (FAST, Heimlich, etc.).
3. MAPS & FACILITIES: Suggest searching nearby facilities.
4. PERSONALIZED MEDICATION: Check age/weight/allergies/interactions.
5. REMINDERS: Confirm schedules.
6. MEDICATION LENS: Identify pills/packaging from images.
7. CHATBOT CONSULTANT: Nutrition, exercise, chronic diseases.
8. MEDICAL DOCUMENT READER: Translate jargon, flag abnormal values (HbA1c, Cholesterol, etc.).
9. MENTAL HEALTH CHECK-IN: 5-question flow (Mood, Energy, Sleep, Stress, Good thing).
10. HEALTH JOURNAL: Record patterns.

TONE: Warm, calm, reassuring. Simple language. Use emojis: ✅ ⚠️ 💊 🏥 📍 🚨 💚 📋 📓.
`;

export const getMediAIResponse = async (messages: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages,
    config: {
      systemInstruction: MEDI_AI_SYSTEM_INSTRUCTION,
      temperature: 0.4,
    },
  });
  
  return response.text || "I'm sorry, I couldn't generate a response.";
};

export const analyzeMedicalImage = async (mimeType: string, base64Data: string, prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    ],
    config: {
      systemInstruction: MEDI_AI_SYSTEM_INSTRUCTION,
      temperature: 0.2,
    }
  });
  
  return response.text || "I couldn't analyze the image.";
};

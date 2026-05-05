import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const processQuery = async (message) => {
    let result = {
        category: 'Important',
        aiReply: null,
        isAtRisk: false
    };

    try {
        const prompt = `You are an AI assistant for a student helpdesk.
Your job is to answer student questions directly whenever possible.
Classify the student's message into strictly ONE of three categories:
1. "FAQ": Use this category for ALMOST EVERYTHING. If the student asks for advice on studying, time management, distractions, common college issues, fees, schedules, etc., you MUST categorize it as "FAQ" and provide a detailed, helpful answer in 'aiReply'. 
2. "Emotional": Use this ONLY if the query expresses severe stress, depression, anxiety, overwhelm, panic, or any risk of self-harm.
3. "Important": Use this ONLY for administrative issues that an AI literally cannot do (like "I need to change my official registered course" or "I want to file a formal complaint").

DO NOT send general advice questions to "Important". You must answer them yourself under "FAQ".

Provide your response strictly in the following JSON schema format without any markdown or formatting (just the raw JSON):
{
  "category": "FAQ" | "Important" | "Emotional",
  "aiReply": "String - If FAQ, provide a comprehensive, helpful, and polite answer directly resolving the student's issue. If Emotional, provide an extremely supportive and comforting message letting them know a professional counselor has been alerted. If Important, leave empty string.",
  "isAtRisk": boolean - true ONLY if category is Emotional.
}

Student Message: "${message}"
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const rawText = response.text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : rawText;
        const parsedResponse = JSON.parse(jsonString);
        
        result.category = parsedResponse.category || 'Important';
        result.aiReply = parsedResponse.aiReply || null;
        result.isAtRisk = parsedResponse.isAtRisk || false;

        console.log("Processed query:", message, "Result:", result);

        return result;
    } catch (e) {
        console.error("Gemini API Error:", e);
        return fallbackRules(message);
    }
};

const fallbackRules = (message) => {
    const text = message.toLowerCase();
    let result = { category: 'Important', aiReply: null, isAtRisk: false };

    const emotionalKeywords = ['stress', 'depressed', 'anxiety', 'overwhelmed', 'suicide', 'give up', 'cry', 'sad', 'hopeless', 'panic', 'tired'];
    if (emotionalKeywords.some(kw => text.includes(kw))) {
        result.category = 'Emotional';
        result.isAtRisk = true;
        result.aiReply = "I am so sorry you are feeling this way. Please know that you are not alone, and we are here to support you. A professional counselor has been alerted and will reach out to you immediately.";
        return result;
    }

    const faqMap = {
        'fees': 'The tuition fees for the current semester are due by the 15th of next month.',
        'schedule': 'You can view your updated class schedule under the "Academics" tab in your portal.',
        'exam': 'The final exams schedule will be published 2 weeks prior to the start of exam week.'
    };
    for (const [key, reply] of Object.entries(faqMap)) {
        if (text.includes(key)) {
            result.category = 'FAQ';
            result.aiReply = reply;
            return result;
        }
    }
    return result;
};

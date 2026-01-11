
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // Note: The SDK might not expose listModels directly on genAI instance in all versions,
        // but the error message suggests checking it. 
        // Actually, for the JS SDK, we typically just try to use a model. 
        // However, we can use the model manager if available, but it's often not straightforward in the high-level SDK.
        // Let's try to infer from a simple test.

        console.log("Testing model availability...");

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`✅ Model available: ${modelName}`);
                // If one works, we are good.
                break;
            } catch (e) {
                if (e.message.includes('404')) {
                    console.log(`❌ Model not found: ${modelName}`);
                } else if (e.message.includes('429')) {
                    console.log(`⚠️ Model found but rate limited: ${modelName}`);
                } else {
                    console.log(`❓ Error with ${modelName}: ${e.message.split('\n')[0]}`);
                }
            }
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();

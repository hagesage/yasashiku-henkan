
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// APIキーの確認
const API_KEY = process.env.GEMINI_API_KEY;
// APIキーがない場合のハンドリングはエンドポイント内で行うか、ここで警告を出す
if (!API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set in .env file.");
} else {
    console.log("API Key loaded: " + API_KEY.substring(0, 5) + "...");
}

// ログ出力ミドルウェア
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// モデル名を変更（gemini-1.5-flashが認識されない場合があるため）
// 特殊なモデルリストにある2.5系を指定（2.0系が制限されているため）
const genAI = new GoogleGenerativeAI(API_KEY || "YOUR_API_KEY_HERE");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post('/api/transform', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: API Key missing' });
        }

        const prompt = `
あなたはプロの編集者です。以下の日本語の文章を、中学生でもスラスラと理解できる、明確でやさしい日本語に書き直してください。

【ルール】
1. 難しい専門用語や熟語は、日常的な言葉に言い換えてください。
2. 一文が長い場合は、適切に複数の文に分けてください。
3. 文体は親しみやすい「です・ます」調、または自然な常体で統一してください。
4. 元の文章の意味や情報の量を変えないでください（要約ではありません）。
5. 出力は変換後の文章のみを行ってください。前置きや解説は不要です。

【元の文章】
${text}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        // テキスト取得の安全策
        const transformedText = response.text ? response.text() : "変換結果を取得できませんでした。";

        res.json({ transformedText });

    } catch (error) {
        console.error('Error transforming text:', error);

        let errorMessage = 'Failed to transform text';
        let tip = '';

        if (error.message.includes('429')) {
            errorMessage = '利用制限（クォータ）を超えました。少し時間を置いてから再試行してください。';
            tip = 'You exceeded your current quota.';
        } else if (error.message.includes('404')) {
            errorMessage = '指定されたAIモデルが見つかりませんでした。';
            tip = 'Model not found.';
        }

        res.status(500).json({
            error: errorMessage,
            details: error.message,
            tip: tip
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

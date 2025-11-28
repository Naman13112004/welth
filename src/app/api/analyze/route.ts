import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const formData = await req.formData();
        const rawFile = formData.get("image");

        if (!(rawFile instanceof Blob)) {
            return NextResponse.json({ error: "Image not found" }, { status: 400 });
        }

        const file = rawFile as File;

        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        const prompt = `
            Analyze this receipt image and extract the following information in JSON format:
            - Total amount (just the number)
            - Date (in ISO format)
            - Description or items purchased (brief summary)
            - Merchant/store name
            - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
            Only respond with valid JSON in this exact format:
            {
                "amount": number,
                "date": "ISO date string",
                "description": "string",
                "merchantName": "string",
                "category": "string"
            }

            If its not a receipt, return an empty object
        `;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: file.type,
                        data: base64,
                    }
                },
                { text: prompt },
            ]
        });

        const text = result.text;
        if (!text) {
            return NextResponse.json({ error: "Model did not return text" }, { status: 400 });
        }
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try {
            const data = JSON.parse(cleanedText);
            return NextResponse.json(
                {
                    amount: parseFloat(data.amount),
                    date: new Date(data.date),
                    description: data.description,
                    category: data.category,
                    merchantName: data.merchantName,
                },
                { status: 200 }
            );
        } catch (error) {
            return NextResponse.json({ error: "Invalid JSON response" }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
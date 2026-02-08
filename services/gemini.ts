
import { GoogleGenAI, Type } from "@google/genai";
import { LabelData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const singleLabelSchema = {
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.STRING, 
      description: "The main brand/collection header. If it spans multiple lines at the very top (e.g. 'DENIM 6-7 25' and 'AW' underneath), capture all lines separated by a newline '\\n'." 
    },
    model: { 
      type: Type.STRING, 
      description: "The alphanumeric model code or style reference, often found near the top or below the header (e.g., D5480AX/NM36)." 
    },
    color: { 
      type: Type.STRING, 
      description: "The primary color name (e.g., Anthracite, Midnight Blue)." 
    },
    size: { 
      type: Type.STRING, 
      description: "The sizing information (e.g., 32-28, Large, 42R)." 
    },
    spn: { 
      type: Type.STRING, 
      description: "The SPN, Order Number, or Factory reference (e.g., 11056)." 
    },
    barcode_type: { 
      type: Type.STRING, 
      description: "The specific barcode symbology if identified (e.g., EAN-13, CODE-128)." 
    },
    barcode_value: { 
      type: Type.STRING, 
      description: "The precise numeric or alphanumeric sequence encoded in the barcode." 
    },
    raw_text: { 
      type: Type.STRING, 
      description: "A complete dump of all text found on this specific label." 
    },
  },
  required: ["raw_text"],
};

const labelListSchema = {
  type: Type.ARRAY,
  items: singleLabelSchema
};

export const extractLabelData = async (
  base64Data: string,
  mimeType: string
): Promise<LabelData[]> => {
  try {
    const modelName = "gemini-3-flash-preview";
    
    const prompt = `
      Act as a high-precision OCR and data extraction specialist for retail logistics.
      Examine the provided document (PDF/Image) which contains physical clothing labels.
      
      Your task:
      1. Segment the document into individual labels.
      2. For EVERY label found, extract the requested fields into a structured format.
      
      FIELD-SPECIFIC INSTRUCTIONS:
      - TITLE: This is the primary brand name or collection line. Clothing labels often have stacked headers (e.g., "COLLECTION" on line 1, "FALL/WINTER" on line 2). Concatenate these using '\\n'.
      - MODEL/STYLE: Look for unique alphanumeric codes.
      - SPN/ORDER: Often a 5-8 digit number labeled as 'Order', 'SPN', or 'PO'.
      - BARCODE: Ensure the 'barcode_value' is exactly as printed under the barcode.
      
      Return a JSON array of objects following the defined schema.
      If no clothing labels or relevant product data is found, return an empty array [].
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: labelListSchema,
        temperature: 0.1, // High precision, low creativity
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("The AI was unable to parse text from this file.");
    }

    const data = JSON.parse(text) as LabelData[];
    return data;
  } catch (error) {
    console.error("Gemini extraction error:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw new Error("Invalid or missing API key. Please check your environment.");
    }
    throw error;
  }
};

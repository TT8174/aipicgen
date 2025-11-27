import { GoogleGenAI } from "@google/genai";
import { SketchSettings, SketchStyle, LineWeight } from "../types";

// Helper to strip the data:image/xyz;base64, prefix
const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};

// Helper to get mime type
const getMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  return match ? match[1] : 'image/jpeg';
};

export const generateSketchFromImage = async (
  originalImageBase64: string,
  settings: SketchSettings
): Promise<string> => {
  try {
    // Initialize client inside function to allow app to load even if env vars are missing initially
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const mimeType = getMimeType(originalImageBase64);
    const rawBase64 = stripBase64Prefix(originalImageBase64);

    // Construct a descriptive prompt based on settings
    let prompt = "Turn this image into a high-quality black and white artistic sketch. ";
    
    // Style Instructions
    switch (settings.style) {
      case SketchStyle.PENCIL:
        prompt += "Style: Graphite pencil sketch with soft shading and realistic textures. ";
        break;
      case SketchStyle.CHARCOAL:
        prompt += "Style: Charcoal drawing with deep blacks, smudged shadows, and rough textures. ";
        break;
      case SketchStyle.INK:
        prompt += "Style: High-contrast ink pen drawing with sharp, confident lines. ";
        break;
      case SketchStyle.MINIMALIST:
        prompt += "Style: Minimalist continuous line art. Simple and abstract. ";
        break;
      case SketchStyle.STIPPLE:
        prompt += "Style: Stippling technique (dotwork) shading. ";
        break;
      case SketchStyle.CROSSHATCH:
        prompt += "Style: Classic cross-hatching shading. ";
        break;
    }

    // Line Weight Instructions
    switch (settings.lineWeight) {
      case LineWeight.THIN:
        prompt += "Lines: Very fine, delicate, and precise. ";
        break;
      case LineWeight.MEDIUM:
        prompt += "Lines: Balanced weight. ";
        break;
      case LineWeight.THICK:
        prompt += "Lines: Bold, thick, and heavy strokes. ";
        break;
    }

    // Darkness/Intensity
    if (settings.darkness < 30) {
      prompt += "Tone: Light and airy, high key, lots of white space. ";
    } else if (settings.darkness > 70) {
      prompt += "Tone: High contrast, low key, heavy dark areas. ";
    }

    prompt += "Output only the transformed image. Do not change the composition, only the style.";

    // Send image first, then text, as per "Edit Images" best practices
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: rawBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Extract the image from the response
    const candidates = response.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
      // First, look for the image part
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      // If no image part found, look for text part (likely an error or refusal)
      for (const part of candidates[0].content.parts) {
        if (part.text) {
          // Pass the model's text response as the error message
          throw new Error(part.text);
        }
      }
    }

    throw new Error("模型未返回图片，亦无错误说明。请重试。");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "生成素描时遇到网络或 API 错误。");
  }
};
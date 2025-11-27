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

// Helper for exponential backoff retry
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      // Check for Rate Limit (429) or Service Unavailable (503)
      const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
      const isServiceUnavailable = error.status === 503 || (error.message && error.message.includes('503'));
      
      if (isRateLimit || isServiceUnavailable) {
        console.warn(`Request failed with ${error.status || 'error'}, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
      }
    }
    throw error;
  }
}

export const generateSketchFromImage = async (
  originalImageBase64: string,
  settings: SketchSettings
): Promise<string> => {
  // Try to get key from process.env (Node/System) or import.meta.env (Vite client-side)
  // This ensures it works on both local dev and Vercel deployments
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("未检测到 API Key。请在 Vercel 环境变量设置中添加 'VITE_API_KEY'，或在本地 .env 文件中配置。");
  }

  try {
    // Initialize client inside the function to ensure env vars are loaded
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
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

    // Wrap the API call in retry logic
    const response = await callWithRetry(async () => {
      // Send image first, then text, as per "Edit Images" best practices
      // Updated to use gemini-3-pro-image-preview for better quality
      return await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
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
          throw new Error(`模型无法生成图片: ${part.text}`);
        }
      }
    }

    throw new Error("模型未返回图片，亦无错误说明。请重试。");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return a user-friendly error message
    if (error.message.includes("API Key")) {
      throw error;
    }
    if (error.status === 429 || error.message.includes("429")) {
        throw new Error("当前请求过多，系统繁忙。已尝试自动重连但失败，请稍后几分钟再试。");
    }
    throw new Error(error.message || "生成素描时遇到网络或 API 错误。");
  }
};
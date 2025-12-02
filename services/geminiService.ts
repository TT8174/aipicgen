import { SketchSettings, SketchStyle, LineWeight } from "../types";

// Configuration for Tencent EdgeOne AI Gateway
const GATEWAY_CONFIG = {
  baseUrl: "https://ai-gateway.eo-edgefunctions7.com/v1/models",
  // Switching to gemini-1.5-flash for broader gateway compatibility while maintaining image capabilities
  model: "gemini-1.5-flash", 
  apiKey: "AIzaSyAyugknLmVAOAo8Lnp7BZ6-KKP_cri65vk",
  oeKey: "e0ffc96211bd4efc9a1dc1cdff816424",
  oeGatewayName: "reborncounselling",
  oeAiProvider: "gemini"
};

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
    // Don't retry on CORS errors (TypeError with 'Failed to fetch') as they are persistent config issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw error;
    }

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
  const responseData = await callWithRetry(async () => {
    const url = `${GATEWAY_CONFIG.baseUrl}/${GATEWAY_CONFIG.model}:generateContent?key=${GATEWAY_CONFIG.apiKey}`;
    
    // Note: Gemini REST API uses snake_case for inline_data
    const body = {
      contents: [
        {
          parts: [
             {
              inline_data: {
                mime_type: mimeType,
                data: rawBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Headers required by Tencent EdgeOne AI Gateway
          'OE-Key': GATEWAY_CONFIG.oeKey,
          'OE-Gateway-Name': GATEWAY_CONFIG.oeGatewayName,
          'OE-AI-Provider': GATEWAY_CONFIG.oeAiProvider
        },
        body: JSON.stringify(body)
      });
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        throw new Error(
          "网络请求失败 (CORS)。\n\n原因：腾讯云 AI 网关拒绝了浏览器的跨域请求。\n\n解决方法：请登录腾讯云 EdgeOne 控制台，检查该网关的 CORS 配置，确保允许您的域名访问，并允许 Headers: OE-Key, OE-Gateway-Name, OE-AI-Provider。"
        );
      }
      throw e;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // ignore json parse error
      }
      
      const errorMessage = errorJson?.error?.message || errorText;
      const status = response.status;
      
      // Throw an object that matches the retry logic structure
      throw { status, message: errorMessage };
    }

    return await response.json();
  });

  // Extract the image from the response
  const candidates = responseData.candidates;
  if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
    // First, look for the image part (inline_data in REST API usually returns inlineData in JS, but check both)
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      // Check for snake_case just in case
      if (part.inline_data && part.inline_data.data) {
        return `data:image/png;base64,${part.inline_data.data}`;
      }
    }

    // If no image part found, look for text part (likely an error or refusal)
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        throw new Error(`模型无法生成图片: ${part.text}`);
      }
    }
  }

  throw new Error("模型未返回图片，亦无错误说明。请重试。");
};
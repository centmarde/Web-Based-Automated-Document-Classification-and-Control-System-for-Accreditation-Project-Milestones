import { ref } from "vue";
import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GEMENI_API_KEY;

if (!apiKey) {
  throw new Error(
    "API key is missing or empty. Please provide a valid API key."
  );
}

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

function formatResponse(content: string): string {
  return content.replace(/\n/g, "<br><think>");
}

export interface DocumentAnalysis {
  documentType: string
  title: string
  tags: string[]
}

export async function analyzeDocument(ocrText: string): Promise<DocumentAnalysis> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a document classification assistant. Analyze the provided text and extract the document type, a suitable title, and relevant tags. Respond ONLY in valid JSON format with keys: documentType, title, and tags (array of strings). Keep tags concise and relevant."
        },
        {
          role: "user",
          content: `Analyze this document text and provide classification:\n\n${ocrText.substring(0, 2000)}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_completion_tokens: 500,
      top_p: 0.95,
      stream: false,
      stop: null,
    });

    let responseText = chatCompletion.choices[0]?.message?.content || "{}";

    // Clean the response: remove markdown code blocks if present
    responseText = responseText.trim();

    // Remove ```json and ``` markers
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }

    responseText = responseText.trim();

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(responseText);
      return {
        documentType: parsed.documentType || "Unknown",
        title: parsed.title || "Untitled Document",
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (parseError) {
      // If JSON parsing fails, try to extract information manually
      console.error("Failed to parse LLM response as JSON:", parseError);
      console.log("Response text:", responseText);

      // Try to extract JSON from the response using regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            documentType: parsed.documentType || "Unknown",
            title: parsed.title || "Untitled Document",
            tags: Array.isArray(parsed.tags) ? parsed.tags : []
          };
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
        }
      }

      // Fallback to default values
      return {
        documentType: "Document",
        title: "Analyzed Document",
        tags: ["unclassified"]
      };
    }
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
}

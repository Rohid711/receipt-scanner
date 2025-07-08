import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { formatCurrency as formatCurrencyFromUtils, formatDate as formatDateFromUtils } from './formatters';

// Initialize the Gemini API with your API key
// In production, use environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to extract receipt data using Gemini Vision
export async function extractReceiptData(imageBase64: string) {
  try {
    console.log("Starting receipt extraction process");
    
    if (!API_KEY) {
      console.error("Missing Gemini API key");
      return {
        success: false,
        error: "API key not configured",
        data: getDefaultReceiptData()
      };
    }

    console.log("API key found, processing image");

    // Remove the data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Create a model instance with vision capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare the prompt for receipt analysis
    const prompt = `
    I need to extract information from a receipt image. Please analyze this receipt and extract the following:
    
    1. Vendor or Store Name
    2. Date of Purchase (in YYYY-MM-DD format)
    3. Total Amount (just the number with decimal)
    4. Individual Items with prices (if visible)
    5. Receipt category (choose one from: Materials, Equipment, Fuel, Office Supplies, Other)
    
    For fuel receipts specifically, the category should be "Fuel".
    
    Your response must be ONLY a valid JSON object with these fields:
    {
      "vendor": "Store Name",
      "date": "YYYY-MM-DD",
      "totalAmount": "123.45",
      "items": [
        { "name": "Item description", "price": "12.34" }
      ],
      "category": "Category from the list above"
    }
    
    Return nothing except the JSON object.
    `;

    console.log("Sending request to Gemini API");

    try {
      // Create image parts for the model
      const imagePart: Part = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };

      // Generate content with text and image
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().trim();
      
      console.log("Received response from Gemini API:", text.substring(0, 100) + "...");
      
      // Parse the JSON response - handle cases where there might be backticks or other formatting
      try {
        // Remove markdown code formatting if present
        let jsonText = text;
        if (text.includes("```json")) {
          jsonText = text.split("```json")[1].split("```")[0].trim();
        } else if (text.startsWith("```") && text.endsWith("```")) {
          jsonText = text.substring(3, text.length - 3).trim();
        }
        
        const jsonData = JSON.parse(jsonText);
        return {
          success: true,
          data: jsonData
        };
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        console.log("Raw response:", text);
        return {
          success: false,
          error: "Failed to parse response - the AI didn't return proper JSON",
          data: getDefaultReceiptData()
        };
      }
    } catch (apiError: any) {
      console.error("API Error:", apiError.message || apiError);
      
      // Check for specific error messages
      if (apiError.message && apiError.message.includes("API key")) {
        return {
          success: false,
          error: "Invalid API key. Please check your Gemini API key in the .env.local file.",
          data: getDefaultReceiptData()
        };
      }
      
      // Check for model deprecation errors
      if (apiError.message && (apiError.message.includes("deprecated") || apiError.message.includes("404"))) {
        return {
          success: false,
          error: "The Gemini model being used has been deprecated. The code has been updated - please refresh the page and try again.",
          data: getDefaultReceiptData()
        };
      }
      
      return {
        success: false,
        error: `Gemini API error: ${apiError.message || "Unknown error"}`,
        data: getDefaultReceiptData()
      };
    }
  } catch (error: any) {
    console.error("Error extracting receipt data:", error);
    return {
      success: false,
      error: `Failed to process image: ${error.message || "Unknown error"}`,
      data: getDefaultReceiptData()
    };
  }
}

// Default receipt data to use as fallback
function getDefaultReceiptData() {
  return {
    vendor: "Unknown Vendor",
    date: new Date().toISOString().split('T')[0],
    totalAmount: "0.00",
    items: [],
    category: "Other"
  };
}

// Function to format currency amounts
export function formatCurrency(amount: string | number) {
  return formatCurrencyFromUtils(amount);
}

// Function to format dates
export function formatDate(dateStr: string) {
  return formatDateFromUtils(dateStr);
} 
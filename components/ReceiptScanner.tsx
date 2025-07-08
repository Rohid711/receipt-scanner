import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaUpload, FaReceipt, FaCheck, FaSpinner, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';
import { extractReceiptData, formatCurrency, formatDate } from '../utils/geminiAPI';
import Camera from './Camera';
import * as pdfjs from 'pdfjs-dist';
import { useSubscription } from '../utils/SubscriptionContext';
import FeatureGuard from './FeatureGuard';

interface ReceiptData {
  vendor: string;
  date: string;
  totalAmount: string;
  items: { name: string; price: string }[];
  category: string;
  notes?: string;
}

interface ReceiptScannerProps {
  onSave?: (receiptData: ReceiptData) => Promise<boolean>;
}

export default function ReceiptScanner({ onSave }: ReceiptScannerProps) {
  const { getFeatureLimit, isFeatureLimited, checkFeatureUsage, incrementFeatureUsage, featureUsage } = useSubscription();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    vendor: '',
    date: '',
    totalAmount: '',
    items: [],
    category: '',
    notes: ''
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [usageData, setUsageData] = useState<{
    currentUsage: number;
    limit: number;
    remaining: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load usage data when component mounts
  useEffect(() => {
    checkUsage();
  }, []);

  // Check if camera is supported
  const checkCameraSupport = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraSupported(false);
        return false;
      }

      // Try to access the camera
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch (error) {
      console.error('Camera not available:', error);
      setIsCameraSupported(false);
      return false;
    }
  };

  // Check usage limits
  const checkUsage = async () => {
    try {
      const usage = await checkFeatureUsage('receipt-scanner');
      setUsageData({
        currentUsage: usage.currentUsage,
        limit: usage.limit,
        remaining: usage.remaining
      });
      
      if (!usage.canUseFeature) {
        setUsageLimitReached(true);
        setErrorMessage('You have reached your monthly limit. Please upgrade your plan or wait until next month.');
      } else {
        setUsageLimitReached(false);
      }
      
      return usage.canUseFeature;
    } catch (error) {
      console.error('Error checking usage:', error);
      return true; // Default to allowing if check fails
    }
  };

  // Process the receipt image using Gemini AI
  const processReceiptImage = async (imageData: string) => {
    // First check if user has reached their usage limit
    const canUse = await checkUsage();
    if (!canUse) {
      setScanState('error');
      return;
    }
    
    setScanState('scanning');
    setErrorMessage(null);
    
    try {
      console.log("Starting receipt processing");
      
      // Increment usage counter before processing
      const updatedUsage = await incrementFeatureUsage('receipt-scanner');
      if (!updatedUsage || !updatedUsage.canUseFeature) {
        setErrorMessage('You have reached your monthly limit. Please upgrade your plan or wait until next month.');
        setScanState('error');
        setUsageLimitReached(true);
        return;
      }
      
      // Update local usage data
      setUsageData({
        currentUsage: updatedUsage.currentUsage,
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining
      });
      
      const result = await extractReceiptData(imageData);
      
      console.log("Process result:", result.success ? "Success" : "Failed", result.error || "");
      
      if (result.success) {
        setReceiptData({
          vendor: result.data.vendor || '',
          date: formatDate(result.data.date) || '',
          totalAmount: result.data.totalAmount || '',
          items: result.data.items || [],
          category: result.data.category || '',
          notes: ''
        });
        setScanState('success');
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || 'Failed to extract data from receipt');
        setScanState('error');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      setErrorMessage(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : 'An unexpected error occurred');
      setScanState('error');
    }
  };

  // Convert PDF to image
  const convertPdfToImage = async (pdfFile: File): Promise<string> => {
    try {
      setIsPdfProcessing(true);
      console.log("Starting PDF conversion process");
      
      // Load the PDF file
      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log("PDF loaded as ArrayBuffer, size:", arrayBuffer.byteLength);
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      
      // Add event listener for unsupported features (using type assertion)
      (loadingTask as any).onUnsupportedFeature = (feature: string) => {
        console.warn('Unsupported PDF feature:', feature);
      };
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully, pages: ${pdf.numPages}`);
      
      // Get the first page
      const page = await pdf.getPage(1);
      console.log("First page loaded");
      
      // Set the scale for rendering
      const viewport = page.getViewport({ scale: 2.0 });
      console.log(`Viewport dimensions: ${viewport.width}x${viewport.height}`);
      
      // Prepare canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }
      
      // Render the PDF page to the canvas
      console.log("Rendering PDF to canvas");
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      console.log("PDF rendered to canvas");
      
      // Convert the canvas to an image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
      console.log("Canvas converted to image data URL");
      
      setIsPdfProcessing(false);
      return imageDataUrl;
      
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      setIsPdfProcessing(false);
      
      // Try to provide a more descriptive error message
      if (error instanceof Error) {
        if (error.message.includes("Worker")) {
          throw new Error('PDF worker initialization failed. Please try again or use an image file instead.');
        } else if (error.message.includes("password")) {
          throw new Error('Password-protected PDFs are not supported. Please try a different file.');
        } else if (error.message.includes("Corrupted")) {
          throw new Error('The PDF file appears to be corrupted. Please try a different file.');
        }
      }
      
      throw new Error('Failed to convert PDF to image. Please try a different file or upload an image directly.');
    }
  };

  // Try to handle Yelp Ad receipts specifically
  const handleYelpReceipt = async (file: File): Promise<boolean> => {
    try {
      // Check if filename contains Yelp-specific patterns
      const isYelpReceipt = 
        file.name.toLowerCase().includes('yelp') || 
        file.name.toLowerCase().includes('advertisement') || 
        file.name.toLowerCase().includes('ad receipt') ||
        file.name.toLowerCase().includes('marketing') ||
        (file.type === 'application/pdf' && 
         (file.name.toLowerCase().includes('ads') || 
          file.name.toLowerCase().includes('invoice')));
      
      if (!isYelpReceipt) {
        return false;
      }

      console.log("Detected potential Yelp receipt, using specialized handler");
      
      // Try to extract text from the PDF to find amount information
      let extractedAmount = '';
      let extractedDate = '';
      
      try {
        // Create a FileReader to read the PDF file
        const fileReader = new FileReader();
        const pdfData = await new Promise<ArrayBuffer>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
          fileReader.onerror = reject;
          fileReader.readAsArrayBuffer(file);
        });
        
        // Load PDF with PDF.js
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfData) });
        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully, extracting text");
        
        // Extract text from the first 3 pages (or fewer if the PDF has fewer pages)
        const maxPages = Math.min(pdf.numPages, 3);
        let fullText = '';
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items.map((item: any) => item.str).join(' ');
          fullText += textItems + ' ';
        }
        
        console.log("Extracted text:", fullText.substring(0, 500) + "...");
        
        // Look for amount patterns ($X.XX or $X,XXX.XX format)
        const amountMatches = fullText.match(/\$\s?(\d{1,3}(,\d{3})*(\.\d{2})?)/g);
        if (amountMatches && amountMatches.length > 0) {
          // Assume the largest amount is the total
          const amounts = amountMatches.map(a => {
            return parseFloat(a.replace(/[\$,]/g, ''));
          });
          const largestAmount = Math.max(...amounts);
          extractedAmount = largestAmount.toFixed(2);
          console.log("Found amount in PDF:", extractedAmount);
        }
        
        // Look for date patterns (MM/DD/YYYY or similar)
        const dateMatches = fullText.match(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g);
        if (dateMatches && dateMatches.length > 0) {
          // Use the first date found
          const dateParts = dateMatches[0].split(/[\/\-]/);
          const month = parseInt(dateParts[0]);
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          const date = new Date(year, month - 1, day);
          extractedDate = date.toISOString().split('T')[0];
          console.log("Found date in PDF:", extractedDate);
        }
      } catch (pdfError) {
        console.error("Error extracting text from PDF:", pdfError);
        // Continue even if text extraction fails
      }
      
      // Create a more descriptive placeholder for Yelp receipts
      const yelpPlaceholderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  <text x="50%" y="120" font-family="Arial" font-size="24" text-anchor="middle" fill="#d32323">
    <tspan x="50%">Yelp Advertisement Receipt</tspan>
  </text>
  <text x="50%" y="170" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">
    <tspan x="50%">File detected as Yelp Ad receipt</tspan>
  </text>
  <rect x="100" y="200" width="300" height="200" fill="#f5f5f5" stroke="#d32323" stroke-width="2"/>
  <text x="250" y="270" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">
    <tspan x="250">Yelp for Business</tspan>
  </text>
  <text x="250" y="300" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">
    <tspan x="250">Monthly Advertisement</tspan>
  </text>
  <text x="250" y="330" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    <tspan x="250">Filename: ${file.name}</tspan>
  </text>
  ${extractedAmount ? `
  <text x="250" y="360" font-family="Arial" font-size="14" text-anchor="middle" fill="#d32323" font-weight="bold">
    <tspan x="250">Amount: $${extractedAmount}</tspan>
  </text>
  ` : `
  <text x="250" y="360" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">
    <tspan x="250">Size: ${Math.round(file.size / 1024)} KB</tspan>
  </text>
  `}
</svg>`;
      
      const placeholderImg = `data:image/svg+xml;base64,${btoa(yelpPlaceholderSvg)}`;
      setPreviewUrl(placeholderImg);
      
      // Create a date from the filename if possible
      let receiptDate = extractedDate || new Date().toISOString().split('T')[0];
      
      // If no date was extracted from the PDF content, try from filename
      if (!extractedDate) {
        // Try to extract date from filename patterns like "jan 1 2025.pdf"
        const dateMatch = file.name.match(/(\w+)\s+(\d+)\s+(\d{4})/i);
        if (dateMatch) {
          const month = dateMatch[1];
          const day = dateMatch[2];
          const year = dateMatch[3];
          
          const monthMap: {[key: string]: number} = {
            'jan': 0, 'january': 0,
            'feb': 1, 'february': 1,
            'mar': 2, 'march': 2,
            'apr': 3, 'april': 3,
            'may': 4,
            'jun': 5, 'june': 5,
            'jul': 6, 'july': 6,
            'aug': 7, 'august': 7,
            'sep': 8, 'september': 8,
            'oct': 9, 'october': 9,
            'nov': 10, 'november': 10,
            'dec': 11, 'december': 11
          };
          
          const monthIndex = monthMap[month.toLowerCase()];
          if (monthIndex !== undefined) {
            const date = new Date(parseInt(year), monthIndex, parseInt(day));
            receiptDate = date.toISOString().split('T')[0];
          }
        }
      }
      
      // Pre-fill with Yelp-specific data
      setReceiptData({
        vendor: 'Yelp for Business',
        date: receiptDate,
        totalAmount: extractedAmount || '',
        items: [],
        category: 'Advertising',
        notes: `Yelp Advertisement Receipt\nFilename: ${file.name}\n${
          extractedAmount ? `Amount detected: $${extractedAmount}` : 'Please fill in the actual amount from the PDF.'
        }`
      });
      
      setScanState('success');
      setErrorMessage(null);
      
      return true;
    } catch (error) {
      console.error("Yelp receipt handler failed:", error);
      return false;
    }
  };

  // Try to load PDF using a different approach as fallback
  const tryDirectUploadForPdf = async (file: File) => {
    try {
      // Create an object URL for the PDF
      const pdfUrl = URL.createObjectURL(file);
      console.log("Created object URL for PDF:", pdfUrl);
      
      // Create a simple text message with receipt information
      const directMessage = `
This is a digital receipt that could not be automatically processed. 
Please enter the details manually below:

File name: ${file.name}
File size: ${Math.round(file.size / 1024)} KB
File type: ${file.type}
      `;
      
      // Set a placeholder preview
      const placeholderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  <text x="50%" y="200" font-family="Arial" font-size="24" text-anchor="middle" fill="#dc3545">
    <tspan x="50%">PDF Preview Not Available</tspan>
  </text>
  <text x="50%" y="240" font-family="Arial" font-size="16" text-anchor="middle" fill="#6c757d">
    <tspan x="50%">Please enter receipt details manually</tspan>
  </text>
  <text x="50%" y="280" font-family="Arial" font-size="14" text-anchor="middle" fill="#6c757d">
    <tspan x="50%">Filename: ${file.name}</tspan>
  </text>
</svg>`;
      
      const placeholderImg = `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
      setPreviewUrl(placeholderImg);
      
      // Set basic receipt data
      setReceiptData({
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: '',
        items: [],
        category: '',
        notes: directMessage
      });
      
      setScanState('success');
      setErrorMessage(null);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error("Fallback PDF handling also failed:", error);
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // First check if user has reached their usage limit
    const canUse = await checkUsage();
    if (!canUse) {
      setScanState('error');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    try {
      if (file.type === 'application/pdf') {
        // Handle PDF file
        setScanState('scanning');
        setErrorMessage(null);
        setPreviewUrl(null);
        
        try {
          console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);
          
          // First, check if this is a Yelp receipt
          const isYelpReceipt = await handleYelpReceipt(file);
          if (isYelpReceipt) {
            console.log("Successfully processed as Yelp receipt");
            return;
          }
          
          // Try standard PDF.js conversion
          const imageData = await convertPdfToImage(file);
          console.log("PDF successfully converted to image, now processing with Gemini AI");
          setPreviewUrl(imageData);
          processReceiptImage(imageData);
        } catch (error) {
          console.error('Error processing PDF:', error);
          
          // Try using fallback method
          const fallbackSucceeded = await tryDirectUploadForPdf(file);
          
          if (!fallbackSucceeded) {
            setErrorMessage(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a different file or upload an image directly.`);
            setScanState('error');
          }
        }
      } else {
        // Handle image file
        console.log(`Processing image file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        const reader = new FileReader();
        reader.onload = () => {
          const imageData = reader.result as string;
          setPreviewUrl(imageData);
          processReceiptImage(imageData);
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
          setErrorMessage('Error reading the image file. Please try a different file.');
          setScanState('error');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      setErrorMessage(`Failed to process the file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setScanState('error');
    }
  };

  const handleScanClick = async () => {
    // First check if user has reached their usage limit
    const canUse = await checkUsage();
    if (!canUse) {
      setScanState('error');
      return;
    }
    
    const isSupported = await checkCameraSupport();
    
    if (isSupported) {
      // Open the camera component
      setCameraActive(true);
    } else {
      // Open file upload dialog if camera is not supported
      document.getElementById('receipt-upload')?.click();
    }
  };

  const handleImageCapture = (imageSrc: string) => {
    // Process the captured image
    setPreviewUrl(imageSrc);
    processReceiptImage(imageSrc);
  };

  const handleSaveReceipt = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      // Include notes in the receipt data
      const dataToSave = {
        ...receiptData,
        notes
      };
      
      const success = await onSave(dataToSave);
      
      if (success) {
        // Reset the scanner after successful save
        resetScanner();
      } else {
        setErrorMessage('Failed to save receipt');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      setErrorMessage('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const resetScanner = () => {
    setScanState('idle');
    setPreviewUrl(null);
    setErrorMessage(null);
    setNotes('');
    setReceiptData({
      vendor: '',
      date: '',
      totalAmount: '',
      items: [],
      category: '',
      notes: ''
    });
  };

  const handleDeleteReceipt = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this receipt data?')) {
      resetScanner();
    }
  };

  // Render the usage information
  const renderUsageInfo = () => {
    if (!usageData) return null;
    
    // If limit is Infinity, show "Unlimited"
    if (usageData.limit === Infinity) {
      return (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Unlimited receipt scanning</p>
        </div>
      );
    }
    
    return (
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Usage: {usageData.currentUsage} / {usageData.limit} receipts this month
          {usageData.remaining > 0 && (
            <span> ({usageData.remaining} remaining)</span>
          )}
        </p>
      </div>
    );
  };

  return (
    <FeatureGuard feature="receipt-scanner">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-soft">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Receipt Scanner
        </h2>
        
        {usageLimitReached && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 my-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 dark:text-red-400 mr-3" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">Usage Limit Reached</h3>
                <p className="text-red-700 dark:text-red-400 mt-1">
                  You have reached your monthly receipt scanning limit. Please upgrade to Pro plan for unlimited scanning or wait until next month.
                </p>
                <a 
                  href="/pricing" 
                  className="inline-block mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  Upgrade Plan
                </a>
              </div>
            </div>
          </div>
        )}

        {renderUsageInfo()}

        <button
          onClick={handleScanClick}
          disabled={usageLimitReached}
          className={`px-4 py-2 rounded-lg font-medium ${
            usageLimitReached
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {usageLimitReached
            ? 'Monthly Limit Reached'
            : 'Scan Receipt'}
        </button>

        {usageLimitReached && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Upgrade to Pro for unlimited receipt scanning
          </p>
        )}
      </div>
    </FeatureGuard>
  );
}
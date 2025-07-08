import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import jsonDb from '../../utils/jsonDb';

// Helper function to wrap text
function wrapText(doc: PDFKit.PDFDocument, text: string, width: number): string[] {
  const words = text.toString().split(' ');
  let line = '';
  const lines = [];
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (doc.widthOfString(testLine) > width) {
      lines.push(line.trim());
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Helper function to get business profile
function getBusinessProfile() {
  try {
    // Get profile from localStorage (server-side we use jsonDb)
    const profiles = jsonDb.getAll('profiles');
    if (profiles && profiles.length > 0) {
      // Always return the most recently updated profile
      // Sort profiles by updated_at if available
      if (profiles.length > 1) {
        profiles.sort((a, b) => {
          const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
          const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
          return bDate.getTime() - aDate.getTime(); // Most recent first
        });
      }
      
      // Return the profile as is, without adding default values for empty fields
      return profiles[0];
    }
    
    // Return minimal default profile if none exists
    return {
      name: '',
      email: '',
      company: '',
      address: '',
      phone: '',
      website: '',
      taxId: '',
      logo: null
    };
  } catch (error) {
    console.error('Error loading business profile:', error);
    // Return minimal default profile
    return {
      name: '',
      email: '',
      company: '',
      address: '',
      phone: '',
      website: '',
      taxId: '',
      logo: null
    };
  }
}

// Helper function to get client by ID
async function getClientById(clientId: number) {
  try {
    // Try to get client from database
    const clients = jsonDb.getAll('clients');
    return clients.find((c: any) => c.id === clientId);
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      client,
      clientId,
      items,
      subtotal,
      taxItems,
      totalAmount,
      notes,
      businessProfile: providedBusinessProfile // Get business profile from request if provided
    } = req.body;

    // Validate client information
    let clientInfo = client;
    
    // If no client object but we have clientId, try to fetch the client
    if (!clientInfo && clientId) {
      clientInfo = await getClientById(clientId);
    }
    
    // If still no client info, return an error
    if (!clientInfo || !clientInfo.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client not found or invalid client information provided' 
      });
    }

    // Get business profile - use provided profile or fetch from database
    const businessProfile = providedBusinessProfile || getBusinessProfile();

    // Create a new PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber}.pdf`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add company logo if available
    if (businessProfile.logo) {
      try {
        // For base64 images, we need to extract the data part
        const logoData = businessProfile.logo.split(',')[1];
        if (logoData) {
          const imgBuffer = Buffer.from(logoData, 'base64');
          
          // Add the image on the left side with a maximum width of 150px
          doc.image(imgBuffer, 50, 50, { width: 150 });
          doc.moveDown(4); // Move down to make space for the logo
        }
      } catch (logoError) {
        console.error('Error adding logo to PDF:', logoError);
      }
    } else {
      // If no logo, add company name as text
      doc.fontSize(24).text(businessProfile.company || '', { align: 'left' });
      doc.moveDown(0.5);
    }

    // Add business info aligned to the right - respect empty fields
    doc.fontSize(10);
    
    // Only add address if it exists
    if (businessProfile.address) {
      doc.text(businessProfile.address, { align: 'right' });
    }
    
    // Only add phone if it exists
    if (businessProfile.phone) {
      doc.text(`Phone: ${businessProfile.phone}`, { align: 'right' });
    }
    
    // Only add email if it exists
    if (businessProfile.email) {
      doc.text(`Email: ${businessProfile.email}`, { align: 'right' });
    }
    
    // Only add website if it exists
    if (businessProfile.website) {
      doc.text(`Website: ${businessProfile.website}`, { align: 'right' });
    }

    // Add invoice title
    doc.moveDown(2);
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Create two columns for invoice details
    const leftColumn = {
      x: 50,
      width: doc.page.width / 2 - 50
    };
    const rightColumn = {
      x: doc.page.width / 2 + 25,
      width: doc.page.width / 2 - 75
    };

    // Add invoice details
    doc.fontSize(10);
    doc.text('Invoice Details:', leftColumn.x, doc.y);
    doc.moveDown(0.5);
    doc.text(`Invoice Number: ${invoiceNumber}`, { indent: 20 })
      .text(`Invoice Date: ${new Date(invoiceDate).toLocaleDateString()}`, { indent: 20 })
      .text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, { indent: 20 });

    // Add client details
    doc.x = rightColumn.x;
    doc.y = doc.y - doc.currentLineHeight() * 4;
    doc.text('Bill To:', { width: rightColumn.width });
    doc.moveDown(0.5);
    doc.text(clientInfo.name, { indent: 20 })
      .text(clientInfo.email || '', { indent: 20 })
      .text(clientInfo.address || '', { indent: 20 });

    // Move down for items table
    doc.x = leftColumn.x;
    doc.moveDown(2);

    // Add items table
    const tableTop = doc.y;
    const tableWidth = doc.page.width - 100;
    const descriptionWidth = tableWidth * 0.4;
    
    // Column positions
    const itemX = leftColumn.x;
    const descriptionX = itemX + 50;
    const quantityX = descriptionX + descriptionWidth;
    const rateX = quantityX + 70;
    const amountX = rateX + 70;

    // Add table headers
    doc.font('Helvetica-Bold')
      .text('Item', itemX, tableTop)
      .text('Description', descriptionX, tableTop)
      .text('Quantity', quantityX, tableTop, { width: 70, align: 'right' })
      .text('Rate', rateX, tableTop, { width: 70, align: 'right' })
      .text('Amount', amountX, tableTop, { width: 70, align: 'right' });

    // Add horizontal line
    doc.moveDown(0.5);
    doc.strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(itemX, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // Reset font
    doc.font('Helvetica');

    // Add items
    let currentY = doc.y;
    items.forEach((item: any, index: number) => {
      // Check if we need a new page
      if (currentY > doc.page.height - 200) {
        doc.addPage();
        currentY = 50;
      }

      const description = item.description.toString();
      const lines = wrapText(doc, description, descriptionWidth);
      
      doc.text(String(index + 1), itemX, currentY)
         .text(lines[0], descriptionX, currentY);

      // Handle wrapped description lines
      if (lines.length > 1) {
        lines.slice(1).forEach(line => {
          currentY += doc.currentLineHeight();
          doc.text(line, descriptionX, currentY);
        });
      }

      doc.text(String(item.quantity), quantityX, currentY, { width: 70, align: 'right' })
         .text(`$${item.rate.toFixed(2)}`, rateX, currentY, { width: 70, align: 'right' })
         .text(`$${item.amount.toFixed(2)}`, amountX, currentY, { width: 70, align: 'right' });

      currentY += doc.currentLineHeight() * 1.5;
      doc.y = currentY;
    });

    // Add horizontal line
    doc.strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(itemX, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown();

    // Add totals
    const totalsX = amountX;
    const totalsWidth = 70;
    
    doc.text('Subtotal:', rateX, doc.y, { width: 70, align: 'right' })
       .text(`$${subtotal.toFixed(2)}`, totalsX, doc.y, { width: totalsWidth, align: 'right' });
    doc.moveDown(0.5);
    
    // Display each tax item
    if (taxItems && taxItems.length > 0) {
      taxItems.forEach((taxItem: { name: string; rate: number; amount: number }) => {
        const taxLabel = taxItem.name ? `${taxItem.name} (${taxItem.rate}%):` : `Tax (${taxItem.rate}%):`;
        doc.text(taxLabel, rateX, doc.y, { width: 70, align: 'right' })
           .text(`$${taxItem.amount.toFixed(2)}`, totalsX, doc.y, { width: totalsWidth, align: 'right' });
        doc.moveDown(0.5);
      });
    }
    
    // Final total
    doc.font('Helvetica-Bold')
       .text('Total:', rateX, doc.y, { width: 70, align: 'right' })
       .text(`$${totalAmount.toFixed(2)}`, totalsX, doc.y, { width: totalsWidth, align: 'right' });

    // Add notes if any
    if (notes) {
      // Make sure we have enough space for notes and footer
      const noteText = notes.toString(); // Ensure notes is a string
      
      // Log the notes for debugging
      console.log('Adding notes to PDF:', noteText);
      
      // Calculate space needed for notes
      const noteLines = wrapText(doc, noteText, doc.page.width / 2);
      const requiredSpace = noteLines.length * doc.currentLineHeight() + 50; // Notes + footer
      
      // Check if we have enough space on the current page
      const remainingSpace = doc.page.height - doc.y - 100;
      
      // If not enough space, move to a better position on the same page
      if (requiredSpace > remainingSpace && remainingSpace < doc.page.height / 4) {
        // Move to a position that leaves enough room for notes and footer
        doc.y = Math.min(doc.y, doc.page.height - requiredSpace - 50);
      }
      
      // Add notes header
      doc.moveDown(1);
      doc.font('Helvetica-Bold').text('Notes:', { align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.5);
      
      // Add notes content
      noteLines.forEach(line => {
        doc.text(line, { align: 'right', width: doc.page.width - 100 });
      });
    }

    // Ensure footer is on the first page
    const footerY = doc.y + 30;
    
    // If footer would be too close to bottom, adjust position
    const footerPosition = footerY > (doc.page.height - 60) 
      ? doc.page.height - 50 // If too close to bottom, place at bottom
      : footerY;
    
    // Add footer with some padding
    doc.moveDown(1);
    doc.fontSize(10)
      .text(
        'Thank you for your business!',
        50,
        footerPosition,
        { align: 'center', width: doc.page.width - 100 }
      );

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    // If we haven't started sending the PDF, send an error response
    if (!res.writableEnded) {
      res.status(500).json({ success: false, message: 'Error generating PDF' });
    }
  }
} 
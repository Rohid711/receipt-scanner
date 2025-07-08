# Bizznex - Modern Business Management App

A modern, clean, and professional web application for businesses. This application provides a user-friendly interface for managing business operations.

## Features

- **Modern UI**: Clean design with proper spacing, alignment, and professional styling
- **AI-Powered Receipt Scanning**: Stylish receipt scanner using Google Gemini AI for accurate data extraction
- **Dashboard**: Overview of key business metrics and upcoming jobs
- **Client Management**: Organize and track all your client information
- **Equipment Management**: Track and manage your business equipment
- **Mobile Responsive**: Works on all devices with a mobile-friendly interface

## Technology Stack

- Next.js for frontend
- Tailwind CSS for styling
- React Icons for high-quality icons
- Modern typography using Inter and Poppins fonts
- Google Gemini AI for receipt processing
- Responsive design for all screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/bizznex.git
cd bizznex
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
   - Create a `.env.local` file in the root of your project
   - Add your Google Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Receipt Scanner Setup

The receipt scanner uses Google's Gemini AI to extract information from images. To use this feature:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file as shown above
3. The scanner will work in two modes:
   - Camera mode: If your device has a camera and you've granted permissions
   - Upload mode: For desktop or when camera is not available

## UI Features

- **Professional Color Scheme**: Light background with high-contrast buttons
- **Modern Typography**: Uses Inter and Poppins fonts for readability
- **Rounded Buttons & Icons**: Well-designed buttons with proper spacing
- **Improved Navigation**: User-friendly sidebar menu
- **Stylish Receipt Scanner**: With scanning animation and receipt display
- **Soft Shadows & Spacing**: Professional feel with attention to detail

## Screenshots

(Add screenshots of your application here)

## License

MIT

## Acknowledgements

- Design inspired by modern business applications
- Receipt processing powered by Google Gemini AI
- Icons from React Icons
- Fonts from Google Fonts

# Landscaping Business Management App with Telegram Mini App Integration

A comprehensive business management solution for landscaping businesses with receipt scanning, expense tracking, employee management, and equipment tracking. Now with Telegram Mini App integration!

## Features

- Receipt scanning and management with Gemini AI
- Excel export for all your business data
- Employee management and payroll
- Equipment tracking and maintenance scheduling
- Full Telegram Mini App integration

## Setting Up the Telegram Mini App

## Important: HTTPS Requirement

Telegram requires HTTPS URLs for Mini Apps. Here are your options:

1. **Production Deployment**: Deploy your app to a platform with HTTPS (Vercel, Netlify, etc.) and use that URL
2. **Local Development with ngrok**: Use ngrok to create a secure tunnel to your local server
3. **Testing with Placeholder**: Use a placeholder URL format for initial testing

## Step 1: Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send the command `/newbot` and follow the prompts to create a new bot
3. Choose a name and username for your bot
4. BotFather will give you a **token** - copy this for later use

## Step 2: Configure Environment Variables

1. Update the `.env` file with your Telegram bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

2. Set a proper WEB_APP_URL:
   - For production: `WEB_APP_URL=https://your-deployed-app.com`
   - For local development with ngrok: `WEB_APP_URL=https://your-ngrok-url.ngrok.io`
   - For testing: `WEB_APP_URL=https://t.me/your_bot_username`

## Step 3: Set Up Local Development with HTTPS (Using ngrok)

1. Install ngrok: https://ngrok.com/download
2. Start your app server:
   ```
   npm run telegram
   ```
3. In another terminal, create an ngrok tunnel:
   ```
   ngrok http 3000
   ```
4. Copy the https URL provided by ngrok (e.g., `https://abcdef123456.ngrok.io`)
5. Update your `.env` file with this URL:
   ```
   WEB_APP_URL=https://abcdef123456.ngrok.io
   ```
6. Restart your server

## Step 4: Configure Web App URL in BotFather

1. Send the command `/mybots` to BotFather
2. Select your newly created bot
3. Click "Bot Settings" > "Menu Button" > "Configure Menu Button"
4. Enter a name like "Open Landscaping App"
5. For the URL, use your HTTPS URL (from ngrok or your deployed app)

## Using the App in Telegram

1. Open your bot in Telegram
2. Send the `/start` command
3. Click the "Open Landscaping App" button
4. The app will open within Telegram, with all features available

## Troubleshooting

- **URL Error**: Telegram requires HTTPS URLs. Make sure your URL starts with `https://`
- **Connection Issues**: If using ngrok, the URL changes each time you restart ngrok. Update your `.env` file and BotFather settings accordingly
- **Invalid URL Format**: Make sure there are no spaces or extra characters in your URL

## Development

### Local Development

```bash
# Run Next.js development server
npm run dev

# Run the server with Telegram integration
npm run server
```

### Deploying to Production

For hosting services like Vercel or Netlify, you'll need to:

1. Deploy the Next.js app as a static export
2. Set up environment variables on your hosting platform
3. Deploy the Express server separately (e.g., on Heroku, Railway, or a VPS)

## Building for Production

```bash
# Build and export static files
npm run export

# Start the production server
npm run telegram
```

## License

MIT

## Email Service Setup

This application includes email functionality powered by Nodemailer and Brevo (Sendinblue) SMTP. You can use this to send automated emails to clients, such as job confirmations and invoices.

### Setup Instructions

1. Create a Brevo (Sendinblue) account at https://www.brevo.com/
2. Navigate to SMTP & API section in your Brevo account
3. Get your SMTP credentials (server, port, login, password)
4. Add these credentials to your `.env.local` file:

```
# Brevo (Sendinblue) SMTP settings
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_username
BREVO_SMTP_PASSWORD=your_brevo_password
BREVO_SENDER_EMAIL=your_company@example.com
```

### Using the Email Service

The application includes a utility for sending emails:

```javascript
// Import the email service
import { sendEmail } from '../utils/emailService';

// Send a simple email
await sendEmail(
  'client@example.com',
  'Subject line',
  'Plain text content',
  '<p>Optional HTML content</p>'
);
```

### Email Templates

Pre-built email templates are available in `utils/emailTemplates.js`:

- **Invoice Emails**: `invoiceEmail(invoice, clientName)`
- **Job Confirmation Emails**: `jobConfirmationEmail(job, clientName)`

Example usage:

```javascript
import { sendEmail } from '../utils/emailService';
const { invoiceEmail } = require('../utils/emailTemplates');

// Generate email content from template
const { text, html } = invoiceEmail(invoiceData, client.name);

// Send email with the template
await sendEmail(client.email, 'Your Invoice', text, html);
```

### API Endpoint

A dedicated API endpoint is available for sending emails:

**POST /api/send-email**

Request body:
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "text": "Plain text content", 
  "html": "<p>Optional HTML content</p>"
}
```

At least one of `text` or `html` is required. #   b i z z n e x  
 #   b i z z n e x  
 #   b i z z n e x  
 "# bizznex" 
"# bizznex" 
"# bizznex" 
"# bizznex" 
#   b i z z n e x  
 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

// Environment variables
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // You'll need to set this in .env

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('out')); // For serving the Next.js static export

// Initialize Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  // Use a properly formatted URL
  // For local development, we'll use a placeholder domain
  // In production, this should be your actual domain
  const webAppUrl = process.env.WEB_APP_URL || 'https://t.me/your_bot_username';
  
  bot.sendMessage(chatId, 'Welcome to the Landscaping Business Management App!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open Landscaping App', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Handle webhook data from Mini App
app.post('/api/telegram-data', (req, res) => {
  const { initData, receipts } = req.body;
  
  // Validate the initData (in production, you should verify this data with Telegram)
  // This is a simplified version
  if (!initData) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  // Store data or perform actions as needed
  // For this demo, we'll just return success
  return res.json({ success: true });
});

// API routes for the Mini App to access
app.get('/api/receipts', (req, res) => {
  // In a real app, this would come from a database
  // For this demo, we'll read from a JSON file if it exists
  try {
    const dataPath = path.join(__dirname, 'data', 'receipts.json');
    
    if (fs.existsSync(dataPath)) {
      const receipts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json({ success: true, data: receipts });
    } else {
      return res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save receipts API endpoint
app.post('/api/receipts', (req, res) => {
  const { receipts } = req.body;
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save receipts to JSON file
    fs.writeFileSync(
      path.join(dataDir, 'receipts.json'),
      JSON.stringify(receipts, null, 2)
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving receipts:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Telegram bot is active. Set up your bot with BotFather.`);
}); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const { collectEmailToFile } = require('./collect-email');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Email collection endpoint
app.post('/api/collect-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const result = await collectEmailToFile(email);
    res.json(result);
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all emails (for admin purposes)
app.get('/api/emails', async (req, res) => {
  try {
    const emailsPath = path.join(__dirname, 'emails.json');
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(emailsPath, 'utf8');
    const emailsData = JSON.parse(fileContent);
    
    res.json({
      success: true,
      totalEmails: emailsData.emails.length,
      emails: emailsData.emails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Could not read emails file'
    });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email collection endpoint: http://localhost:${PORT}/api/collect-email`);
});
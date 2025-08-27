const fs = require('fs').promises;
const path = require('path');

// Simple email collection endpoint for Node.js
async function collectEmailToFile(email) {
  const emailsFilePath = path.join(__dirname, 'emails.json');
  
  try {
    // Read existing emails
    let emailsData;
    try {
      const fileContent = await fs.readFile(emailsFilePath, 'utf8');
      emailsData = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist or is invalid, create new structure
      emailsData = {
        emails: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Check if email already exists
    if (emailsData.emails.some(entry => entry.email === email)) {
      throw new Error('Email already registered');
    }
    
    // Add new email with timestamp
    emailsData.emails.push({
      email: email,
      submittedAt: new Date().toISOString(),
      source: 'landing-page'
    });
    
    // Update metadata
    emailsData.lastUpdated = new Date().toISOString();
    
    // Save back to file
    await fs.writeFile(emailsFilePath, JSON.stringify(emailsData, null, 2));
    
    console.log(`✅ Email collected: ${email}`);
    console.log(`📊 Total emails: ${emailsData.emails.length}`);
    
    return {
      success: true,
      message: 'Email successfully collected',
      totalEmails: emailsData.emails.length
    };
    
  } catch (error) {
    console.error('❌ Error collecting email:', error.message);
    throw error;
  }
}

// Export for use in other files
module.exports = { collectEmailToFile };

// If running this file directly, you can test it
if (require.main === module) {
  // Test function
  const testEmail = process.argv[2];
  if (testEmail) {
    collectEmailToFile(testEmail)
      .then(result => console.log('✅ Test successful:', result))
      .catch(error => console.error('❌ Test failed:', error.message));
  } else {
    console.log('Usage: node collect-email.js test@example.com');
  }
}
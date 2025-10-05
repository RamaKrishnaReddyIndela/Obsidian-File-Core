// test-email.js
const sendEmail = require('./utils/sendEmail');

(async () => {
  try {
    await sendEmail({
      to: 'srivasavireddy431@gmail.com',
      subject: 'Obsidian File Core Test Email',
      text: 'This is a test email from Obsidian File Core',
      html: '<h1>Hello from Obsidian File Core</h1>',
    });
    console.log('✅ Email sent successfully');
  } catch (err) {
    console.error('❌ Email failed:', err.message);
  }
})();

// Quick test to verify rebranding is working
const helpBot = require('./forticrypt-backend/ai/appHelpBot');

console.log('🧪 Testing Obsidian File Core Rebranding\n');

// Test key questions to verify rebranding
const testQuestions = [
  "Hi there!",
  "What is Obsidian File Core?",
  "What tools are available?", 
  "How do I encrypt a file?",
  "Can I recover hidden files later?"
];

testQuestions.forEach((question, index) => {
  console.log(`${index + 1}. Question: "${question}"`);
  const answer = helpBot.reply(question);
  console.log(`   Answer: ${answer.substring(0, 100)}...`);
  
  // Check if answer contains the new branding
  const hasNewBranding = answer.includes('Obsidian File Core');
  const hasOldBranding = answer.includes('FortiCrypt');
  
  console.log(`   ✅ New Branding: ${hasNewBranding ? 'YES' : 'NO'}`);
  console.log(`   ❌ Old Branding: ${hasOldBranding ? 'YES (needs fix)' : 'NO (good)'}`);
  console.log();
});

console.log('🎯 Rebranding verification complete!');
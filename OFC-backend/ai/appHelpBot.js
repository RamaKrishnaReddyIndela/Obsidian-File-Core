const fs = require('fs');
const path = require('path');
const natural = require('natural');

const KB_PATH = path.join(__dirname, 'appHelpKB.json');
let KB = [];

function loadKB() {
  try {
    const raw = fs.readFileSync(KB_PATH, 'utf8');
    KB = JSON.parse(raw);
  } catch (e) {
    KB = [];
  }
}

loadKB();

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestAnswer(userText) {
  if (!userText) return null;
  const q = normalize(userText);
  const qp = q.replace(/[0-9]/g, '');
  
  // Greetings
  if (/\b(hi|hii|hiii|hello|hey|hello there|good (morning|afternoon|evening))\b/.test(qp)) {
    return '👋 Hello! I\'m Deekshi, your Obsidian File Core AI assistant. I can help you with:\n\n🔐 File encryption & decryption\n🧠 AI security analysis\n📧 OTP verification\n🖼️ Steganography\n👤 Account management\n\nWhat would you like to know?';
  }

  // Enhanced knowledge base search
  if (KB.length === 0) return null;
  
  let best = { score: 0, a: null, matchType: 'none' };
  
  // 1. First try exact pattern matching from KB
  for (const item of KB) {
    const patterns = item.q.split('|');
    for (const pattern of patterns) {
      const normalizedPattern = normalize(pattern);
      
      // Exact phrase match - prioritize longer, more specific matches
      if (q.includes(normalizedPattern) || normalizedPattern.includes(q)) {
        if (normalizedPattern.length > 6) { // Require longer matches for exact hits
          return item.a;
        }
      }
      
      // Enhanced keyword-based matching with better scoring
      const qWords = q.split(' ').filter(w => w.length > 2);
      const pWords = normalizedPattern.split(' ').filter(w => w.length > 2);
      let exactMatches = 0;
      let partialMatches = 0;
      
      // Count exact word matches (higher priority)
      for (const qWord of qWords) {
        for (const pWord of pWords) {
          if (qWord === pWord) {
            exactMatches++;
            break;
          } else if (pWord.includes(qWord) || qWord.includes(pWord)) {
            partialMatches += 0.5; // Partial matches have lower weight
          }
        }
      }
      
      // Calculate enhanced match score
      const totalMatches = exactMatches + partialMatches;
      const matchRatio = totalMatches / Math.max(qWords.length, pWords.length);
      
      // Bonus for exact matches
      const exactBonus = exactMatches >= 2 ? 0.3 : 0;
      const finalScore = matchRatio + exactBonus;
      
      if (finalScore > 0.6 && finalScore > best.score) {
        best = { score: finalScore, a: item.a, matchType: 'keyword', exactMatches, pattern };
      }
    }
  }
  
  // 2. If no good keyword match, try similarity matching
  if (best.score < 0.5) {
    for (const item of KB) {
      const candQ = normalize(item.q.split('|')[0]); // Use first pattern for similarity
      const score = natural.JaroWinklerDistance(q, candQ);
      if (score > best.score && score > 0.6) {
        best = { score, a: item.a, matchType: 'similarity' };
      }
    }
  }
  
  // 3. Return best match if found
  if (best.a && best.score > 0.3) {
    return best.a;
  }
  
  // 4. Enhanced fallback with context-aware responses
  if (/\b(help|support|how|what|when|where|why)\b/.test(qp)) {
    return "🤖 I'm here to help! Here are some things you can ask me:\n\n📝 **File Operations:**\n• \"How do I upload and encrypt a file?\"\n• \"How to decrypt files?\"\n• \"Generate secure download link\"\n\n🔒 **Security:**\n• \"How does OTP work?\"\n• \"What is malware scanning?\"\n• \"AI sensitivity detection\"\n\n🛠️ **Tools:**\n• \"What tools are available?\"\n• \"How to use steganography?\"\n• \"Secret vault features\"\n\nJust ask me anything about Obsidian File Core! 😊";
  }
  
  // Final comprehensive fallback
  return "🤔 I didn't quite catch that. I'm Deekshi, your Obsidian File Core AI assistant!\n\n✨ **Popular questions:**\n• How do I encrypt a file?\n• What encryption algorithms are available?\n• How does OTP verification work?\n• How to use the AI analyzer?\n• What is the secret vault?\n\n💡 **Tip:** Try asking specific questions about encryption, security, or any Obsidian File Core feature!";
}

exports.reply = (message) => {
  const answer = findBestAnswer(message);
  if (answer) return answer;
  
  return "🚀 **Obsidian File Core Help Available!**\n\nI can assist you with:\n\n🔐 **File Security:**\n• Uploading & encrypting files\n• Decryption with OTP verification\n• Secure download links\n• 9 encryption algorithms\n\n🧠 **AI Analysis:**\n• Malware detection\n• Sensitivity scanning\n• Threat classification\n• File risk assessment\n\n🔧 **Advanced Tools:**\n• Steganography (hide data in images)\n• Secret vault management\n• Key generators\n• Hash calculators\n\n👤 **Account:**\n• Profile management\n• Password reset\n• Security settings\n• Activity history\n\n💬 **Try asking:** 'How do I encrypt a file?' or 'What is OTP verification?'";
};

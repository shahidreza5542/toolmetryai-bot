const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { tickets } = require('../commands/ticket');

// Track user activity
const userActivity = new Map();
const lastRoasted = new Map();
const aiResponseCooldown = new Map(); // Track AI response cooldowns

// Toolmetry Knowledge Base
const knowledgeBase = {
  greetings: {
    patterns: ['hi', 'hello', 'hey', 'koi hai', 'namaste', 'hola'],
    responses: {
      en: "Hello! Welcome to Toolmetry support. How can I assist you today?",
      hi: "Namaste! Toolmetry support mein aapka swagat hai. Main aapki kaise madad kar sakta hu?"
    }
  },
  whatIsToolmetry: {
    patterns: ['what is toolmetry', 'toolmetry kya hai', 'ye website kis liye hai', 'what does toolmetry do'],
    responses: {
      en: "Toolmetry is your go-to platform for useful online tools designed to make your daily tasks easier. From utilities to productivity tools, we've got you covered!",
      hi: "Toolmetry ek aisi jagah hai jahan aapko aapke kaam aane wale behtareen tools milte hain. Ye aapke daily tasks ko aasan banane ke liye design kiya gaya hai."
    }
  },
  passwordReset: {
    patterns: ['password reset', 'forgot password', 'password bhool gaya', 'reset password'],
    responses: {
      en: "To reset your password, click on 'Forgot Password' on the login page. You'll receive a reset link on your registered email.",
      hi: "Password reset karne ke liye login page par 'Forgot Password' par click karein. Aapko registered email par ek reset link mil jayega."
    }
  },
  newAccount: {
    patterns: ['new account', 'sign up', 'register', 'naya account', 'account kaise banaye'],
    responses: {
      en: "Click the 'Sign Up' button in the top right corner of the website and register using your email ID.",
      hi: "Aap website ke top right corner mein 'Sign Up' button par click karke apni email ID se naya account bana sakte hain."
    }
  },
  howToUseTools: {
    patterns: ['how to use', 'tool use', 'kaise use karein', 'tools ko kaise use karein'],
    responses: {
      en: "Each tool has a guide on its page. Simply input your details and the tool will give you results instantly!",
      hi: "Har tool ke page par ek chhota sa guide ya description diya gaya hai ki use kaise istemaal karna hai. Bas apni details input karein aur tool aapko result de dega."
    }
  },
  mobileSupport: {
    patterns: ['mobile', 'phone', 'android', 'ios', 'mobile par chalegi'],
    responses: {
      en: "Yes! Toolmetry is fully mobile-responsive. You can use it on your phone's browser without any issues.",
      hi: "Haan, Toolmetry poori tarah se mobile-responsive hai. Aap ise apne phone ke browser par aaram se use kar sakte hain."
    }
  },
  toolError: {
    patterns: ['error', 'not working', 'problem', 'issue', 'error aa raha hai'],
    responses: {
      en: "Please refresh the page and try again. If the problem persists, please let us know which tool you were using so we can assist better.",
      hi: "Kripya page ko refresh karein aur dobara try karein. Agar problem phir bhi aaye, toh humein detail mein batayein ki aap kaunsa tool use kar rahe the."
    }
  },
  pricing: {
    patterns: ['free', 'price', 'cost', 'pricing', 'kitne paise', 'free hai'],
    responses: {
      en: "Yes, most tools on Toolmetry are free to use. If there's any premium feature, it will be clearly mentioned on the tool page.",
      hi: "Haan, Toolmetry par uplabdh tools aam taur par free hain. Agar koi premium feature hoga toh wahan mention kiya jayega."
    }
  },
  apiAccess: {
    patterns: ['api', 'developer', 'integration', 'programmatic access'],
    responses: {
      en: "Currently, our tools are designed for direct website use. For API access details, please check our documentation or contact support.",
      hi: "Abhi ke liye hamare tools directly website ke through use kiye ja sakte hain. API access ki details ke liye aap documentation check kar sakte hain."
    }
  },
  humanSupport: {
    patterns: ['human', 'talk to agent', 'customer care', 'insaan se baat', 'support se baat'],
    responses: {
      en: "I'm transferring your query to our human support team. They will contact you via email or chat shortly.",
      hi: "Main abhi aapki query hamari human support team ko transfer kar raha hu. Wo jald hi aapse email ya chat ke zariye contact karenge."
    }
  },
  thanks: {
    patterns: ['thank', 'shukriya', 'dhanyawad', 'thanks'],
    responses: {
      en: "You're welcome! Is there anything else I can help you with?",
      hi: "Aapka swagat hai! Kya main aapki aur koi madad kar sakta hu?"
    }
  },
  goodbye: {
    patterns: ['bye', 'goodbye', 'alvida', 'take care'],
    responses: {
      en: "Goodbye! Have a great day. Feel free to reach out anytime you need help!",
      hi: "Alvida! Aapka din shubh ho. Jab bhi aapko madad chahiye, zaroor sampark karein!"
    }
  }
};

// Detect language (simple heuristic)
function detectLanguage(message) {
  const hindiWords = ['hai', 'kya', 'kaise', 'karo', 'kar', 'karein', 'hain', 'hoga', 'batao', 'bataiye', 'madad', 'swagat', 'dhanyawad', 'shukriya'];
  const msg = message.toLowerCase();
  const hasHindi = hindiWords.some(word => msg.includes(word));
  return hasHindi ? 'hi' : 'en';
}

// Match query to knowledge base
function matchQuery(message) {
  const msg = message.toLowerCase();
  
  for (const [key, data] of Object.entries(knowledgeBase)) {
    for (const pattern of data.patterns) {
      if (msg.includes(pattern.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}

// Get AI response using Gemini
async function getGeminiResponse(userMessage, context = '') {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('Gemini API key not found, using fallback');
      return null;
    }

    const prompt = `You are Toolmetry AI Support Assistant. Toolmetry is a platform providing useful online tools.
    
Context: ${context}
User Message: "${userMessage}"

Instructions:
- Keep response under 250 characters
- Be friendly and professional
- If user asks about non-support topics (weather, news, etc.), politely say "I'm here to help! Could you provide more details about your issue?"
- Respond in the same language as the user's query (English or Hinglish mix)
- Focus only on Toolmetry-related support queries

Response:`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 8000 }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    return null;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return null;
  }
}

// Free AI roast generator
async function generateAIRoast(username) {
  try {
    const prompt = `Roast user "${username}" with a funny, light-hearted joke about being inactive. Keep it under 120 characters.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || `${username} is so inactive, they make sloths look hyperactive!`;
  } catch (error) {
    const roasts = [
      "has been so quiet, we thought they were a ghost!",
      "is so inactive, even snails are racing past them!",
      "finally showed up! We missed your silence!",
      "must be practicing to be invisible!"
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
  }
}

// Generate AI Support Response
async function generateSupportResponse(userMessage, channelType = 'support') {
  // First try knowledge base
  const matchedKey = matchQuery(userMessage);
  
  if (matchedKey) {
    const lang = detectLanguage(userMessage);
    return knowledgeBase[matchedKey].responses[lang] || knowledgeBase[matchedKey].responses.en;
  }
  
  // If no match, try Gemini AI
  const geminiResponse = await getGeminiResponse(userMessage, channelType);
  if (geminiResponse) {
    return geminiResponse;
  }
  
  // Ultimate fallback
  const lang = detectLanguage(userMessage);
  const fallbacks = {
    en: "I'm here to help! Could you provide more details about your issue?",
    hi: "Main aapki madad ke liye yahan hu! Kripya apni samasya ke baare mein aur bataein?"
  };
  return fallbacks[lang];
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild?.id;
    const now = Date.now();
    const channelName = message.channel.name;

    // Update activity
    userActivity.set(userId, now);

    // AI Support for Ticket Channels & AI-Support Channel
    const isTicketChannel = channelName.startsWith('ticket-');
    const isAISupportChannel = channelName === 'ai-support' || channelName.includes('ai-support');
    
    if (isTicketChannel || isAISupportChannel) {
      // Get cooldown key
      const cooldownKey = isTicketChannel ? `ticket-${message.channel.id}` : `ai-support-${message.channel.id}`;
      const lastResponse = aiResponseCooldown.get(cooldownKey) || 0;
      const timeSinceResponse = now - lastResponse;

      // Only respond if it's been at least 15 seconds since last AI response (avoid spam)
      if (timeSinceResponse > 15000) {
        let context = 'general support';
        
        // If it's a ticket channel, get ticket info
        if (isTicketChannel) {
          for (const [id, t] of tickets) {
            if (t.channelId === message.channel.id && t.status === 'open') {
              context = `ticket subject: ${t.subject}`;
              break;
            }
          }
        }

        const aiResponse = await generateSupportResponse(message.content, context);

        const embed = new EmbedBuilder()
          .setTitle('🤖 Toolmetry AI Support')
          .setDescription(aiResponse)
          .setColor(0x00D4AA)
          .setFooter({ text: 'Powered by AI • Toolmetry Support' })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        aiResponseCooldown.set(cooldownKey, now);
      }
    }

    // Check for inactive users to roast (every 10 messages)
    if (message.guild && Math.random() < 0.1) {
      const members = await message.guild.members.fetch();
      const inactiveUsers = [];
      
      for (const [memberId, member] of members) {
        if (member.user.bot || memberId === userId) continue;
        
        const lastActive = userActivity.get(memberId);
        const lastRoast = lastRoasted.get(memberId) || 0;
        
        // If inactive for 30+ minutes and not roasted in last 2 hours
        if (lastActive && (now - lastActive) > 30 * 60 * 1000 && (now - lastRoast) > 2 * 60 * 60 * 1000) {
          inactiveUsers.push(member);
        }
      }

      // Roast a random inactive user
      if (inactiveUsers.length > 0) {
        const target = inactiveUsers[Math.floor(Math.random() * inactiveUsers.length)];
        const roastText = await generateAIRoast(target.user.username);
        
        const embed = new EmbedBuilder()
          .setTitle('🔥 Inactivity Roast!')
          .setDescription(`${target.user} ${roastText}`)
          .setColor(0xFF4500)
          .setFooter({ text: 'Powered by AI • Toolmetry AI Bot' })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        lastRoasted.set(target.user.id, now);
      }
    }

    // Leveling system (Discord-only, no DB)
    if (message.guild) {
      const key = `xp-${message.guild.id}-${userId}`;
      const currentXP = global.userXP?.get(key) || 0;
      const gainedXP = Math.floor(Math.random() * 10) + 5;
      
      if (!global.userXP) global.userXP = new Map();
      global.userXP.set(key, currentXP + gainedXP);
    }
  }
};

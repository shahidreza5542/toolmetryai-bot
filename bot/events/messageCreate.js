const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Track user activity
const userActivity = new Map();
const lastRoasted = new Map();

// Free AI roast generator
async function generateAIRoast(username) {
  try {
    const prompt = `Roast user "${username}" with a funny, light-hearted joke about being inactive. Keep it under 120 characters.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || `\${username} is so inactive, they make sloths look hyperactive!`;
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

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild?.id;
    const now = Date.now();

    // Update activity
    userActivity.set(userId, now);

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

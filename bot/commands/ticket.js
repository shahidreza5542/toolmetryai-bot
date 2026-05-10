const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');

// In-memory ticket storage (Discord-only, no database)
const tickets = new Map();
let ticketCounter = 0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a support ticket')
    .addStringOption(option =>
      option
        .setName('subject')
        .setDescription('Subject of your ticket')
        .setRequired(true)),

  async execute(interaction) {
    const subject = interaction.options.getString('subject');
    const guild = interaction.guild;
    const user = interaction.user;

    // Check if user already has an open ticket
    for (const [id, ticket] of tickets) {
      if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
        const existingChannel = guild.channels.cache.get(ticket.channelId);
        if (existingChannel) {
          return interaction.reply({
            content: `⚠️ You already have an open ticket: ${existingChannel}`,
            ephemeral: true
          });
        }
      }
    }

    // Create ticket channel
    ticketCounter++;
    const channelName = `ticket-${ticketCounter.toString().padStart(4, '0')}`;

    try {
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
          }
        ]
      });

      // Store ticket in memory
      const ticketId = `TICKET-${ticketCounter}`;
      tickets.set(ticketId, {
        ticketId: ticketId,
        guildId: guild.id,
        channelId: ticketChannel.id,
        userId: user.id,
        username: user.username,
        subject,
        status: 'open',
        claimedBy: null,
        createdAt: new Date()
      });

      // Send initial message
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketCounter}`)
        .setDescription(
          `**Welcome to Toolmetry AI Support!**\n\n` +
          `**Subject:** ${subject}\n` +
          `**User:** ${user.tag}\n` +
          `**Created:** <t:${Math.floor(Date.now()/1000)}:R>`
        )
        .setColor(0x00D4AA)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: 'Toolmetry AI Ticket System', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticketId}`)
            .setLabel('Claim')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👋'),
          new ButtonBuilder()
            .setCustomId(`ticket_close_${ticketId}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId(`ticket_delete_${ticketId}`)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🗑️')
        );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Ticket created: ${ticketChannel}`,
        ephemeral: true
      });
    } catch (err) {
      console.error('Error creating ticket:', err);
      await interaction.reply({
        content: '❌ Failed to create ticket. Please try again.',
        ephemeral: true
      });
    }
  }
};

// Export tickets Map for use in interaction handler
module.exports.tickets = tickets;

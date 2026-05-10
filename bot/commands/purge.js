const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('contains')
        .setDescription('Only delete messages containing this text')
        .setRequired(false)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    const contains = interaction.options.getString('contains');

    try {
      await interaction.deferReply({ ephemeral: true });

      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: amount });

      // Filter messages
      let filteredMessages = messages;

      if (user) {
        filteredMessages = filteredMessages.filter(m => m.author.id === user.id);
      }

      if (contains) {
        filteredMessages = filteredMessages.filter(m => 
          m.content.toLowerCase().includes(contains.toLowerCase())
        );
      }

      // Delete messages
      const deleted = await interaction.channel.bulkDelete(filteredMessages, true);

      const embed = new EmbedBuilder()
        .setTitle('Messages Purged')
        .setDescription(`Deleted ${deleted.size} messages`)
        .setColor(0xff0000)
        .setTimestamp();

      if (user) {
        embed.addFields({ name: 'User Filter', value: user.tag, inline: true });
      }

      if (contains) {
        embed.addFields({ name: 'Text Filter', value: contains, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('Error purging messages:', err);
      await interaction.editReply({
        content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.',
        ephemeral: true
      });
    }
  }
};

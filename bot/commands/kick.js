const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Ban = require('../../models/Ban');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for kick')
        .setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: 'User not found in this server.',
        ephemeral: true
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'You cannot kick this user.',
        ephemeral: true
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: 'I cannot kick this user.',
        ephemeral: true
      });
    }

    try {
      await member.kick(`${reason} | By: ${interaction.user.tag}`);

      const kick = new Ban({
        guildId: interaction.guild.id,
        userId: user.id,
        username: user.username,
        moderatorId: interaction.user.id,
        reason,
        type: 'kick',
        active: false
      });

      await kick.save();

      const embed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setDescription(`${user.tag} has been kicked`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: interaction.user.tag }
        )
        .setColor(0xffa500)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log to mod channel
      const Guild = require('../../models/Guild');
      const guildSettings = await Guild.findOne({ guildId: interaction.guild.id });
      if (guildSettings?.moderation?.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(guildSettings.moderation.logChannelId);
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }
      }
    } catch (err) {
      console.error('Error kicking user:', err);
      await interaction.reply({
        content: 'Failed to kick user.',
        ephemeral: true
      });
    }
  }
};

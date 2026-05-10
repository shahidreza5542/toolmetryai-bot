const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const hugs = [
  "https://media.giphy.com/media/od5H3PmEG5Ixn8aMXo/giphy.gif",
  "https://media.giphy.com/media/l4FGpPki5cw1T7gO0U/giphy.gif",
  "https://media.giphy.com/media/3M4NnpLt1L5yK9z94F/giphy.gif"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Hug someone')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to hug')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const hugGif = hugs[Math.floor(Math.random() * hugs.length)];

    const embed = new EmbedBuilder()
      .setTitle('🤗 Hug!')
      .setDescription(`${interaction.user} hugged ${targetUser}!`)
      .setImage(hugGif)
      .setColor(0xFF69B4)
      .setFooter({ text: 'Toolmetry AI' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

import { TextChannel, RichEmbed, Message, DMChannel, GroupDMChannel } from 'discord.js';
import fs from 'fs';
import logger from './logger';

export default (channel: TextChannel | DMChannel | GroupDMChannel, media: string, post: any, match: string, originalMessage: Message) => {
  const embed = new RichEmbed()
  .attachFile(media)
  .setColor('ff62a5')
  .setDescription(`${post.ups} Upvotes and ${post.num_comments} comments so far.\nPreview requested by <@${originalMessage.author.id}>`)
  .setThumbnail(originalMessage.author.avatarURL)
  .setTimestamp(originalMessage.createdTimestamp)
  .setURL(`https://www.reddit.com/${match}`)
  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
  .setTitle(`r/${post.subreddit} - ${post.title}`);

  channel.send(embed)
  .then((message) => {
    const messageSent = (message as Message);

    if (channel.type === 'text') {
      const textChannel = (channel as TextChannel);

      logger.info('Media sent', {
        guildName: textChannel.guild.name,
        guildId: textChannel.guild.id,
        channelName: textChannel.name,
        channelId: textChannel.id,
        channelType: textChannel.type,
        senderUsername: originalMessage.author.tag,
        senderId: originalMessage.author.id,
        media: messageSent.attachments.array()[0].url,
      });

      originalMessage.delete();
    } else {
      logger.info('Media sent', {
        channelType: channel.type,
        senderUsername: originalMessage.author.tag,
        senderId: originalMessage.author.id,
        media: messageSent.attachments.array()[0].url,
      });
    }
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    // Stop le typing
    channel.stopTyping();
    // Suppression du fichier
    fs.unlinkSync(media);
  });
}
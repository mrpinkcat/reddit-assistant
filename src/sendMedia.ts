import { TextChannel, RichEmbed, Message, DMChannel, GroupDMChannel } from 'discord.js';
import fs from 'fs';
import loadingMessage from './loadingMessage';
import logger from './logger';
import { MESSAGE_COLOR, MESSAGE_FOOTER } from './utils';

export default (
    channel: TextChannel | DMChannel | GroupDMChannel,
    media: string,
    post: any,
    match: string,
    originalMessage: Message,
    loadingMessage?: loadingMessage
  ) => {
  const embed = new RichEmbed()
    .setColor(MESSAGE_COLOR)
    .setFooter(MESSAGE_FOOTER)
    .attachFile(media)
    .setDescription(`${post.ups} Upvotes and ${post.num_comments} comments so far.\nPreview requested by <@${originalMessage.author.id}>`)
    .setThumbnail(originalMessage.author.avatarURL)
    .setTimestamp(originalMessage.createdTimestamp)
    .setURL(`https://www.reddit.com/${match}`)
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
      if (loadingMessage) {
        loadingMessage.delete();
      }
    }
  })
  .catch((err) => {
    console.log(err);
    if (err.code === 40005 && loadingMessage) {
      loadingMessage.error('The reddit content is too large');
    }
  })
  .finally(() => {
    // Suppression du fichier
    fs.unlinkSync(media);
  });
}
import { TextChannel, RichEmbed, Message } from 'discord.js';
import fs from 'fs';

export default (textChannel: TextChannel, media: string, post: any, match: string, originalMessage: Message) => {
  const embed = new RichEmbed()
  .attachFile(media)
  .setColor('ff62a5')
  .setDescription(`${post.ups} Upvotes and ${post.num_comments} comments so far.\nPreview requested by <@${originalMessage.author.id}>`)
  .setThumbnail(originalMessage.author.avatarURL)
  .setTimestamp(originalMessage.createdTimestamp)
  .setURL(`https://www.reddit.com/${match}`)
  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
  .setTitle(`r/${post.subreddit} - ${post.title}`);

  textChannel.send(embed)
  .then(() => {
    console.log('Message send');
    originalMessage.delete()
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    // Stop le typing
    textChannel.stopTyping();
    // Suppression du fichier
    fs.unlinkSync(media);
  });
}
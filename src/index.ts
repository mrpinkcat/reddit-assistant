import Discord, { TextChannel, RichEmbed, Message, Guild } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import https from 'https';
import uniqid from 'uniqid';

import config from './env';
import logger from './logger';

const bot = new Discord.Client();

let guilds: Guild[] = []

bot.login(config.discord.token);

bot.on('ready', () => {
  logger.info('Bot is ready');
  bot.user.setActivity(`reddit links on ${bot.guilds.array().length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
});

bot.on('guildCreate', (guild) => {
  console.log('GUILD JOIN');
  console.log(guilds.length);
  guilds.push(guild);
  console.log(guilds.length);
  bot.user.setActivity(`reddit links on ${guilds.length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
});

bot.on('guildDelete', (guild) => {
  console.log('GUILD LEAVE');
  console.log(guilds.length);
  guilds.slice(guilds.indexOf(guild));
  console.log(guilds.length);
  bot.user.setActivity(`reddit links on ${guilds.length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
});

bot.on('message', (message) => {
  const textChannel = (message.channel as TextChannel);
  
  const articleRegex = /(r\/)([A-Za-z0-9_]+\/)((comments)\/)([a-z|0-9]+)/g
  const article = message.content.match(articleRegex);
  if (article) {
    const id = uniqid();
    logger.info('Matching message', {
      content: message.content,
      author: message.author.username,
      authorId: message.author.id,
      channel: textChannel.name,
      channelId: message.channel.id,
      guild: message.guild.name,
      guildId: message.guild.id,
      matches: article,
      id,
    });
    article.forEach((match) => {
      axios.get(`https://api.reddit.com/${match}`)
      .then((res) => {
        
        const post = res.data[0].data.children[0].data;
        let crosspostData: any;

        if (post.crosspost_parent_list) {
          crosspostData = post.crosspost_parent_list[0];
        }

        let contentUrl: string;
        let ext: string;

        if (post.preview && post.preview.reddit_video_preview || crosspostData && crosspostData.preview && crosspostData.preview.reddit_video_preview) {
          if (crosspostData) {
            console.log(crosspostData.preview);
            ext = 'mp4';
            contentUrl = crosspostData.preview.reddit_video_preview.fallback_url;
            console.log('crosspostData.preview');
          } else {
            console.log(post.preview);
            ext = 'mp4';
            contentUrl = post.preview.reddit_video_preview.fallback_url;
            console.log('post.preview');
          }
        } else if (post.media && post.media.reddit_video && post.media.reddit_video.fallback_url || crosspostData && crosspostData.media && crosspostData.media.reddit_video && crosspostData.media.reddit_video.fallback_url) {
          if (crosspostData) {
            console.log(crosspostData.media);
            ext = 'mp4';
            contentUrl = crosspostData.media.reddit_video.fallback_url;
            console.log('crosspostData.media');
          } else {
            console.log(post.media);
            ext = 'mp4';
            contentUrl = post.media.reddit_video.fallback_url;
            console.log('post.media');
          }
        } else {
          if (crosspostData) {
            console.log(crosspostData.url);
            ext = 'jpg';
            contentUrl = crosspostData.url;
            console.log('post.url');
          } else {
            console.log(post.url);
            ext = 'jpg';
            contentUrl = post.url;
            console.log('post.url');
          }
        }
        
        if (!contentUrl.match(articleRegex) && !contentUrl.startsWith('https://youtu.be')) {
          textChannel.startTyping();

          // Création du fichier à écrire
          const file = fs.createWriteStream(`reddit-assistant-${id}.${ext}`);


          https.get(contentUrl, (response) => {
            if (res.status !== 200) {
              logger.error('Error while downloading conent', { errorCode: res.status})
            }
  
            // Check si le fichier est plus petit que 8Mo
            if (response.headers["content-length"] && parseInt(response.headers["content-length"]) >= 8000000) {
              const embed = new RichEmbed()
              .setColor('ff62a5')
              .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
              .setTitle('The file is too large !')
              .setDescription(`Sorry but the file is too large for uploading it 😔\nHere is a link to ask forgiveness 😇\n${contentUrl}`);
              textChannel.send(embed)
              .finally(() => {
                // Stop le typing
                textChannel.stopTyping();
                // Suppression du fichier
                fs.unlinkSync(`reddit-assistant-${id}.${ext}`);
              });
            } else {
              response.pipe(file);
              file.on('finish', () => {
                file.close();
                console.log(`${file.bytesWritten / 1000000}Mo DOWLADING COMPLETE`);
                if (file.bytesWritten === 0) {
                  const embed = new RichEmbed()
                  .setColor('ff62a5')
                  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
                  .setTitle('I can\'t download this !')
                  .setDescription('Sorry but the post content is undownable 😔');
                  textChannel.send(embed)
                  .then((sendMessage) => {
                    const errorMessage = (sendMessage as Message);
                    errorMessage.delete(60000);
                  })
                  .finally(() => {
                    // Stop le typing
                    textChannel.stopTyping();
                    // Suppression du fichier
                    fs.unlinkSync(`reddit-assistant-${id}.${ext}`);
                  });
                } else {
  
                  const embed = new RichEmbed()
                  .attachFile(`reddit-assistant-${id}.${ext}`)
                  .setColor('ff62a5')
                  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
                  .setURL(contentUrl)
                  .setTitle(`${post.title} (click to view the media)`);
  
                  textChannel.send(undefined, embed)
                  .then(() => {
                    console.log('Message send');
                  })
                  .catch((err) => {
                    console.log(err);
                  })
                  .finally(() => {
                    // Stop le typing
                    textChannel.stopTyping();
                    // Suppression du fichier
                    fs.unlinkSync(`reddit-assistant-${id}.${ext}`);
                  });
                }
              });
            }
          });

        // Si c'est un lien youtube
        } else if (contentUrl.startsWith('https://youtu.be')) {
          console.log('lien youtube');

          textChannel.send(`${post.subreddit_name_prefixed} - ${post.title}\n${contentUrl}`);
        } else {
          console.log('this is not a media post');
        }
      })
      .catch((err) => {
        logger.error('Error white getting Reddit API', {
          url: `https://api.reddit.com/${match}`,
          match,
          id,
          err,
        });
        console.log(err.message);
        console.log(err);
      });
    });
  }
});

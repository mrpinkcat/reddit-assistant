import Discord, { TextChannel, RichEmbed, Message, Guild } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import https from 'https';
import uniqid from 'uniqid';

import config from './env';
import logger from './logger';
import { getAudioUrl, downloadFile } from './utils';
import audioAssembler from './audioAssembler';

export const bot = new Discord.Client();

let guilds: Guild[] = []

bot.login(config.discord.token);

bot.on('ready', () => {
  logger.info('Bot is ready');
  bot.user.setActivity(`reddit links on ${bot.guilds.array().length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
  console.log(bot.guilds.array().length);
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
      // channel: textChannel.name, BUG DM
      channelId: message.channel.id,
      // guild: message.guild.name, BUG DM
      // guildId: message.guild.id, BUG DM
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
        let contentUrlSound: string;
        let ext: string;

        // TO SPLIT CODE
        if (post.preview && post.preview.reddit_video_preview || crosspostData && crosspostData.preview && crosspostData.preview.reddit_video_preview) {
          if (crosspostData) {
            ext = 'mp4';
            contentUrl = crosspostData.preview.reddit_video_preview.fallback_url;
            contentUrlSound = getAudioUrl(contentUrl);
            console.log('crosspostData.preview');
          } else {
            ext = 'mp4';
            contentUrl = post.preview.reddit_video_preview.fallback_url;
            contentUrlSound = getAudioUrl(contentUrl);
            console.log('post.preview');
          }
        } else if (post.media && post.media.reddit_video && post.media.reddit_video.fallback_url || crosspostData && crosspostData.media && crosspostData.media.reddit_video && crosspostData.media.reddit_video.fallback_url) {
          if (crosspostData) {
            ext = 'mp4';
            contentUrl = crosspostData.media.reddit_video.fallback_url;
            contentUrlSound = getAudioUrl(contentUrl);
            console.log('crosspostData.media');
          } else {
            ext = 'mp4';
            contentUrl = post.media.reddit_video.fallback_url;
            contentUrlSound = getAudioUrl(contentUrl);
            console.log('post.media');
          }
        } else {
          if (crosspostData) {
            ext = 'jpg';
            contentUrl = crosspostData.url;
            console.log('crosspostData.url');
          } else {
            ext = 'jpg';
            contentUrl = post.url;
            console.log('post.url');
          }
        }
        
        if (!contentUrl.match(articleRegex) && !contentUrl.startsWith('https://youtu.be')) {
          textChannel.startTyping();

          console.log(contentUrl);

          if (ext === 'mp4') {
            downloadFile(contentUrl, 'mp4', `video-${id}`).then(() => {
              downloadFile(contentUrlSound, 'mp3', `audio-${id}`).then(() => {
                audioAssembler(`video-${id}.mp4`, `audio-${id}.mp3`, `reddit-media-${id}`).then(() => {
                  const embed = new RichEmbed()
                    .attachFile(`reddit-media-${id}.mp4`)
                    .setColor('ff62a5')
                    .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
                    .setTitle(`${post.title}`);
                  
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
                      fs.unlinkSync(`reddit-media-${id}.mp4`);
                    });
                })
                .catch(() => {
                  // Stop le typing
                  textChannel.stopTyping();
                  // Suppression des fichiers
                  fs.unlinkSync(`video-${id}.mp4`);
                  fs.unlinkSync(`audio-${id}.mp3`);
                  fs.unlinkSync(`reddit-media-${id}.mp4`);
                });
              })
              .catch(() => {
                const embed = new RichEmbed()
                  .attachFile(`video-${id}.mp4`)
                  .setColor('ff62a5')
                  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
                  .setTitle(`${post.title}`);
                
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
                    fs.unlinkSync(`video-${id}.mp4`);
                  });
              });
            });
          } else {
            downloadFile(contentUrl, 'jpg', `image-${id}`).then(() => {
              const embed = new RichEmbed()
                .attachFile(`image-${id}.jpg`)
                .setColor('ff62a5')
                .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
                .setTitle(`${post.title}`);
              
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
                  fs.unlinkSync(`image-${id}.jpg`);
                });
            })
          }

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

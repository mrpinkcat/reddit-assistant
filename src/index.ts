import Discord, { DMChannel, GroupDMChannel, TextChannel } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import uniqid from 'uniqid';

import config from './env';
import logger from './logger';
import { downloadFile, updateStatus, sendJoinMessage } from './utils';
import audioAssembler from './audioAssembler';
import sendMedia from './sendMedia';
import getExtention from './getExtention';
import loadingMessage from './loadingMessage';

export const bot = new Discord.Client();

bot.login(config.discord.token);

bot.on('ready', () => {
  logger.info('Bot is ready');
  updateStatus();
});

bot.on('guildCreate', (guild) => {
  console.log(`Bot join ${guild.name}`);
  updateStatus();
  sendJoinMessage(guild);
});

bot.on('guildDelete', (guild) => {
  console.log(`Bot leave ${guild.name}`);
  updateStatus();
});

bot.on('message', (message) => {
  const channel = message.channel;
  if (channel instanceof DMChannel || channel instanceof GroupDMChannel) {
    return;
  }
  
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
      console.log(match);
      axios.get(`https://api.reddit.com/${match}`)
      .then(async (res) => {
        
        const post = res.data[0].data.children[0].data;
        let crosspostData: any;

        if (post.crosspost_parent_list) {
          crosspostData = post.crosspost_parent_list[0];
        }

        let contentUrl: string;
        let contentUrlSound: string;
        let ext: string;

        //@ts-ignore
        ({ext, contentUrl, contentUrlSound} = getExtention(post))
        
        if (!contentUrl.match(articleRegex) && !contentUrl.startsWith('https://youtu.be')) {          
          console.log(contentUrl);
          
          if (ext === 'mp4') {
            const loadingProgressionMessage = await new loadingMessage(channel).sendStatus('Dowloading files...');
            try {
              await downloadFile(contentUrl, 'mp4', `video-${id}`);
              await downloadFile(contentUrlSound, 'mp3', `audio-${id}`);
              await loadingProgressionMessage.sendStatus('Assembling video & audio...');
              await audioAssembler(`video-${id}.mp4`, `audio-${id}.mp3`, `reddit-media-${id}`, loadingProgressionMessage);
              sendMedia(channel, `./reddit-media-${id}.mp4`, post, match, message, loadingProgressionMessage);
            } catch (error) {
              if (error === 403) {
                loadingProgressionMessage.delete();
                sendMedia(channel, `video-${id}.mp4`, post, match, message, loadingProgressionMessage);
              } else {
                loadingProgressionMessage.delete();
                // Suppression des fichiers
                fs.unlinkSync(`video-${id}.mp4`);
                fs.unlinkSync(`audio-${id}.mp3`);
                fs.unlinkSync(`reddit-media-${id}.mp4`);
              }
            }
          } else {
            downloadFile(contentUrl, 'jpg', `image-${id}`).then(() => {
              sendMedia(channel, `image-${id}.jpg`, post, match, message);
            });
          }

        // Si c'est un lien youtube
        } else if (contentUrl.startsWith('https://youtu.be')) {
          console.log('lien youtube');

          channel.send(`${post.subreddit_name_prefixed} - ${post.title}\n${contentUrl}`);
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

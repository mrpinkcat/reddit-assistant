import Discord, { TextChannel, RichEmbed } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import https from 'https';

import config from './env';

const bot = new Discord.Client();

bot.login(config.discord.token);

bot.on('ready', () => {
  console.log('Let\'s assist !');
});

bot.on('message', (message) => {
  const textChannel = (message.channel as TextChannel);
  console.log(`Message '${message.content}' from @${message.author.username} in #${textChannel.name} of ${message.guild.name} was recive the ${new Date()}`);
  
  const articleRegex = /(r\/)([A-Za-z0-9_]+\/)((comments)\/)([a-z|0-9]+)/g
  const article = message.content.match(articleRegex);
  if (article) {
    article.forEach((match) => {
      axios.get(`https://api.reddit.com/${match}`)
      .then((res) => {
        const post = res.data[0].data.children[0].data;
        console.log(post);
        let contentUrl: string;
        let ext: string;
        if (post.preview && post.preview.reddit_video_preview) {
          console.log(post.preview);
          ext = 'mp4';
          contentUrl = post.preview.reddit_video_preview.fallback_url;
          console.log('post.preview');
        } else if (post.media && post.media.reddit_video && post.media.reddit_video.fallback_url) {
          console.log(post.media);
          ext = 'mp4';
          contentUrl = post.media.reddit_video.fallback_url;
          console.log('post.media');
        } else {
          console.log(post.url);
          ext = 'jpg';
          contentUrl = post.url;
          console.log('post.url');
        }
        console.log('Content URL :')
        console.log(contentUrl);
        if (!contentUrl.match(articleRegex)) {
          textChannel.startTyping();
          // Définition du fichier à écrire
          const file = fs.createWriteStream(`reddit-assistant-${message.createdTimestamp}-${post.id}.${ext}`);
          https.get(contentUrl, function(response) {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log('DOWLADING COMPLETE');

              // Check si le fichier est plus petit que 8Mo
              if (file.bytesWritten <= 8000000) {

                const embed = new RichEmbed()
                .attachFile(`reddit-assistant-${message.createdTimestamp}-${post.id}.${ext}`)
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
                  fs.unlinkSync(`reddit-assistant-${message.createdTimestamp}-${post.id}.${ext}`);                  // Suppression du fichier
                });

              } else {
                textChannel.send(`Sorry but the file is too large for uploading it 😔\nHere is a link to ask forgiveness ☺️\n${contentUrl}`)
                .finally(() => {
                  // Stop le typing
                  textChannel.stopTyping();
                  // Suppression du fichier
                  fs.unlinkSync(`reddit-assistant-${message.createdTimestamp}-${post.id}.${ext}`);
                });
              }
            });
          });
        } else {
          console.log('this is not a media post');
        }
      })
      .catch((err) => {
        console.log(err);
      });
    });
  } else {
    console.log('No url match for this message');
  }
});

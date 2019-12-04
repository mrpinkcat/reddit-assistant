import https from 'https';
import fs from 'fs';
import Promise from 'bluebird';

import { bot } from './index'
import { Guild, RichEmbed, TextChannel } from 'discord.js';
import logger from './logger';

export const getAudioUrl = (videoUrl: string): string => {
  console.log(`sound ${videoUrl}`);
  const articleRegex = /\/+([A-Z])\w+/g
  const toRemplaceArray = videoUrl.match(articleRegex);
  if (toRemplaceArray !== null) {
    const toRemplaceText = toRemplaceArray[0];
    const audioUrl = videoUrl.replace(toRemplaceText, '/audio')
    console.log(`sound = ${audioUrl}`)
    return audioUrl;
  } else {
    console.log(`sound ERROR toRemplaceArray === null | ${videoUrl}`);
    return 'error';
  }
}

export const downloadFile = (url: string, ext: string, output: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`DOWNLOAD ${url}`);
  
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error('Error while downloading conent', { errorCode: response.statusCode});
        reject(403);
      } else {
        // Création du fichier à écrire
        const file = fs.createWriteStream(`${output}.${ext}`);

        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`${file.bytesWritten / 1000000}Mo DOWLADING COMPLETE`);
          resolve(`${output}.${ext}`);
        });
      }
    });
  });
}

export const updateStatus = () => {
 logger.info(`The bot is connected on ${bot.guilds.array().length} servers`);
 bot.guilds.forEach((guild) => {
   console.log('-', guild.name, 'owned by', guild.owner.user.tag);
 });
  bot.user.setActivity(`links on ${bot.guilds.array().length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
}

export const sendJoinMessage = (guild: Guild) => {
  const embed = new RichEmbed()
  .attachFile('./assets/hohellothere.gif')
  .setColor('ff62a5')
  .setFooter('Coded with 💔& ☕️by Mr. Pink#9591')
  .setTitle('**HO HELLO THERE !**')
  .setDescription('I’m your Reddit link assistant, thanks for inviting me')
  .addField(':movie_camera: __Basic utilisation__', 'Send a Reddit link anywhere and I’ll post the preview of it’s media')
  .addField(':tools: __Functionality__', 'I’m compatible with Reddit images, gifs, videos and YouTube posts')
  .addField(':computer: __Source code__', 'All the code of this application is open source & [available on GitHub](https://github.com/mrpinkcat/reddit-assistant)')
  .addField(':bug: __Bug report__', 'If you encouter any bugs or if you have any ideas for improve this bot, please [opening an issue](https://github.com/mrpinkcat/reddit-assistant/issues/new) on GitHub or add *Mr. Pink#9591* on Discord');
  // Selection d'un channel pour envoyer le message de join
  if (guild.systemChannel) {
    (guild.systemChannel as TextChannel).send(undefined, embed);
  } else {
    (guild.channels.find((channel) => channel.type === 'text') as TextChannel).send(undefined, embed);
  }
}

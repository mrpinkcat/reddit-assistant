import https from 'https';
import fs from 'fs';

import { bot } from './index'
import { Guild, RichEmbed, TextChannel } from 'discord.js';
import logger from './logger';

export const MESSAGE_FOOTER = 'Coded with  ☕️ by Mr. Pink#9591';
export const MESSAGE_COLOR = 'ff62a5';

export const getAudioUrl = (videoUrl: string): string => {
  console.log(`sound ${videoUrl}`);
  /**
   * 
   */
  const articleRegex = /\/+([A-Z])\w+/g;
  const toRemplaceArray = videoUrl.match(articleRegex);
  if (toRemplaceArray !== null) {
    const toRemplaceText = toRemplaceArray[0];
    const audioUrl = videoUrl.replace(toRemplaceText, '/DASH_audio')
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
        console.error(`Error while downloading ${ext} conent ${ext === 'mp3' ? '\n Probably because the content don\'t have sound.' : ''}`, { errorCode: response.statusCode});
        reject(response.statusCode);
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
    guild.client.fetchUser(guild.ownerID).then((user) => {
      console.log('-', guild.name, 'owned by', user.username);
    });
  });
  bot.user.setActivity(`links on ${bot.guilds.array().length} server${bot.guilds.array().length > 1 ? 's' : ''}`, { type: 'LISTENING' });
}

export const sendJoinMessage = (guild: Guild) => {
  const embed = new RichEmbed()
    .setColor(MESSAGE_COLOR)
    .setFooter(MESSAGE_FOOTER)
    .attachFile('./assets/hohellothere.gif')
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

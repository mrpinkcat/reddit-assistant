import express, { Request, Response, NextFunction } from 'express';
import { bot } from './index';
import config from './env'
import { TextChannel, RichEmbed } from 'discord.js';
import logger from './logger';
import bodyParser from 'body-parser';

/**
 * Midleware for checking the authorization with the token
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers['authorization'];

  if (token) {
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }

    if (token === config.authToken) {
      next()
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
}

const app = express();

app.use(bodyParser.json());

app.get('/heartbeat', (req, res) => res.sendStatus(200));

app.post('/message', checkAuth, (req, res) => {
  const fields: { name: string, value: string }[] = req.body.fields;
  const title: string = req.body.title;

  if (fields && title) {
    // Création de l'embed
    const embed = new RichEmbed({
      title,
      footer: { text: 'Coded with 💔& ☕️by Mr. Pink#9591' },
      timestamp: new Date(),
    });
    
    fields.forEach((field) => {
      embed.addField(field.name, field.value);
    });

    // Ajout de champs par défaut
    embed
    .addBlankField()
    .setColor('ff62a5')
    .addField(':computer: __Source code__', 'All the code of this application is open source & [available on GitHub](https://github.com/mrpinkcat/reddit-assistant)')
    .addField(':bug: __Bug report__', 'If you encouter any bugs or if you have any ideas for improve this bot, please [opening an issue](https://github.com/mrpinkcat/reddit-assistant/issues/new) on GitHub or add *Mr. Pink#9591* on Discord');

    // Loop dans chaque guild
    bot.guilds.array().forEach((guild, index) => {

      // Selection d'un channel pour envoyer le message
      if (guild.systemChannel) {
        (guild.systemChannel as TextChannel).send(embed).then(() => {
          logger.info('Custom message sent', {
            guild: guild.name,
          });

          // Pour check si on a envoyé le message a toutes les guilds pour renvoyer la réponse HTTP
          if (index + 1 === bot.guilds.array().length) {
            sendResponse();
          }
        });
      } else {
        (guild.channels.find((channel) => channel.type === 'text') as TextChannel).send(embed).then(() => {
          logger.info('Custom message sent', {
            guild: guild.name,
          });

          // Pour check si on a envoyé le message a toutes les guilds pour renvoyer la réponse HTTP
          if (index + 1 === bot.guilds.array().length) {
            sendResponse();
          }
        });
      }

      const sendResponse = () => {
        res.status(200).send({
          status: 'Message sent',
          guilds: bot.guilds.array(),
        });
      }
      
    })
  } else {
    res.sendStatus(400);
  }
});

/**
 * Launch the custom messsage server on port :3000
 */
export default () => {
  app.listen(3000, () => {
    logger.info('Custom message server listening on :3000');
  });
}

import { Message, RichEmbed, TextChannel } from 'discord.js';
import { MESSAGE_COLOR, MESSAGE_FOOTER } from './utils';

export default class {
  /**
   * The channel where the message will be sent 
   */
  private channel: TextChannel;

  /**
   * The discord object of the loading message
   */
  private message?: Message;

  /**
   * Instantiate a new loading message 
   * @param channel The channel where the message will be sent
   * @param title The title of the message
   */
  constructor(channel: TextChannel) {
    this.channel = channel;
  }

  /**
   * Send a loading message without progess bar to the channel
   */
  public async sendStatus(status: string) {
    const embed = new RichEmbed()
      .setColor(MESSAGE_COLOR)
      .setFooter(MESSAGE_FOOTER)
      .setTitle(status);
    if (this.message instanceof Message) {
      this.message.edit(embed);
    } else {
      this.message = await this.channel.send(embed);
    }
    return this;
  }

  /**
   * Send a loading message with progess bar to the channel
   */
  public async sendPercentage(status: string, percentage: number) {
    const embed = new RichEmbed()
      .setColor(MESSAGE_COLOR)
      .setFooter(MESSAGE_FOOTER)
      .setTitle(status)
      .setDescription(this.generatePercentBar(percentage));
    if (this.message instanceof Message) {
      this.message.edit(embed);
    } else {
      this.message = await this.channel.send(embed);
    }
    return this;
  }

  public async error(title: string) {
    const embed = new RichEmbed()
      .setColor(MESSAGE_COLOR)
      .setFooter(MESSAGE_FOOTER)
      .setTitle(`:no_entry: ${title} :no_entry:`);
    if (this.message) {
      await this.message.edit(embed);
      setInterval(() => {
        this.message?.delete();
        this.message = undefined;
      }, 5000);
    } else {
      this.message = await this.channel.send(embed);
      setInterval(() => {
        this.message?.delete();
        this.message = undefined;
      }, 5000);
    }
  }

  public delete() {
    if (this.message) {
      this.message.delete();
      this.message = undefined;
    }
  }

  /**
   * Generate the emoji progress bar
   * @param percent Percentage compete
   * @returns Emoji progress bar
   */
  private generatePercentBar(percent: number):string {
    const length = 10;
    let progressBar = '';
    const numberOfGreen = Math.round(percent / 10);
    const numberOfWhite = Math.round((100 - percent) / 10);
    for (let index = 0; index < numberOfGreen; index++) {
      progressBar = `${progressBar}:green_circle:`;
    }
    for (let index = 0; index < numberOfWhite; index++) {
      progressBar = `${progressBar}:white_circle:`;
    }
    return progressBar;
  }
}
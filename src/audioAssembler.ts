import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import loadingMessage from './loadingMessage';

// I redefined global variabe to avoid the 'Duplicate identifier' error
Promise = require('bluebird');

export default (video: string, audio: string, output: string, loadingMessage: loadingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let lastProgressUpdate: number;
    ffmpeg()
      .input(video)
      .input(audio)
      // VERB ?
      // .on('start', () => {
      //   console.log('start');
      // })
      .on('end', () => {
        loadingMessage.delete();
        fs.unlinkSync(video);
        fs.unlinkSync(audio);
        // console.log('ok !')
        resolve(output);
      })
      .on('error', (err) => {
        console.log(`ffmpeg error !\n${err.message}`);
        reject(err.message);
      })
      .on('progress', async (progress) => {
        if (lastProgressUpdate) {
          console.log(new Date().getTime() - lastProgressUpdate);
          // Avoit spamming the discord API
          if (new Date().getTime() - lastProgressUpdate > 1300) {
            await loadingMessage.sendPercentage(`Assembling video & audio... (${Math.round(progress.percent)}%)`, progress.percent);
            lastProgressUpdate = new Date().getTime();
          }
        } else {
          await loadingMessage.sendPercentage(`Assembling video & audio... (${Math.round(progress.percent)}%)`, progress.percent);
          lastProgressUpdate = new Date().getTime();
        }
        console.log(`Processing: ${progress.percent}% done`);
      })
      .output(`${output}.mp4`)
      .run();
  });
}
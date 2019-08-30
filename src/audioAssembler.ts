import ffmpeg from 'fluent-ffmpeg';
import Promise from 'bluebird';
import fs from 'fs';

export default (video: string, audio: string, output: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(video)
      .input(audio)
      // VERB ?
      // .on('start', () => {
      //   console.log('start');
      // })
      .on('end', () => {
        fs.unlinkSync(video);
        fs.unlinkSync(audio);
        // console.log('ok !')
        resolve(output);
      })
      .on('error', (err) => {
        console.log(`ffmpeg error !\n${err.message}`);
        reject(err.message);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .output(`${output}.mp4`)
      .run();
  });
}
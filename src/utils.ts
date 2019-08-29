import https from 'https';
import fs from 'fs';
import Promise, { resolve, reject } from 'bluebird';

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
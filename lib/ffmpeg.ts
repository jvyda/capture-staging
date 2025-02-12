import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: await toBlobURL(
        '/ffmpeg-core.js',
        'application/javascript'
      ),
      wasmURL: await toBlobURL(
        '/ffmpeg-core.wasm',
        'application/wasm'
      ),
    });
  }

  return ffmpeg;
}

export async function trimVideo(
  inputFile: File,
  startTime: number,
  endTime: number
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  
  await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
  
  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-ss',
    startTime.toString(),
    '-t',
    (endTime - startTime).toString(),
    '-c',
    'copy',
    'output.mp4'
  ]);
  
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}

export async function extractAudio(
  inputFile: File
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  
  await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
  
  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-vn',
    '-acodec',
    'libmp3lame',
    'output.mp3'
  ]);
  
  const data = await ffmpeg.readFile('output.mp3');
  return new Blob([data], { type: 'audio/mp3' });
}

export async function generateThumbnail(
  inputFile: File,
  time: number
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  
  await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
  
  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-ss',
    time.toString(),
    '-vframes',
    '1',
    'thumbnail.jpg'
  ]);
  
  const data = await ffmpeg.readFile('thumbnail.jpg');
  return new Blob([data], { type: 'image/jpeg' });
}
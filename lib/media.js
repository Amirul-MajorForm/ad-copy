'use strict';

// Static and video handling, ported from ROAST (creative-analyzer) so both
// tools read creatives the same way:
//   - images are resized to fit 1200px and re-encoded as JPEG
//   - videos are sampled into 6 evenly spaced key frames (720px wide)

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const VIDEO_EXT = /\.(mp4|mov|webm|avi|mkv|m4v)$/i;

function isVideoFile(file) {
  return (file.mimetype || '').startsWith('video/') || VIDEO_EXT.test(file.originalname || '');
}

function extractFrames(videoPath, tmpDir, frameCount = 6) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error('Could not read video: ' + err.message));

      const duration = (metadata.format && metadata.format.duration) || 30;
      const times = Array.from({ length: frameCount }, (_, i) => (duration / (frameCount + 1)) * (i + 1));
      const frames = new Array(frameCount).fill(null);

      const extractFrame = (idx) => {
        if (idx >= times.length) {
          resolve(frames.filter(Boolean));
          return;
        }
        const framePath = path.join(tmpDir, `frame_${Date.now()}_${idx}_${Math.random().toString(36).slice(2)}.jpg`);
        ffmpeg(videoPath)
          .seekInput(times[idx])
          .frames(1)
          .outputOptions(['-vf', "scale='min(720,iw):-2'", '-q:v', '5'])
          .output(framePath)
          .on('end', () => {
            try {
              if (fs.existsSync(framePath)) {
                frames[idx] = fs.readFileSync(framePath).toString('base64');
                fs.unlinkSync(framePath);
              }
            } catch (e) {}
            extractFrame(idx + 1);
          })
          .on('error', () => {
            if (fs.existsSync(framePath)) try { fs.unlinkSync(framePath); } catch (e) {}
            extractFrame(idx + 1);
          })
          .run();
      };

      extractFrame(0);
    });
  });
}

async function compressImage(filePath, mimeType) {
  let sharp;
  try { sharp = require('sharp'); } catch (e) { sharp = null; }

  if (sharp) {
    try {
      const buf = await sharp(filePath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
      return { data: buf.toString('base64'), mediaType: 'image/jpeg' };
    } catch (e) {}
  }

  const buf = fs.readFileSync(filePath);
  return { data: buf.toString('base64'), mediaType: mimeType || 'image/jpeg' };
}

// Turns one multer upload into a creative the prompt builder understands.
// Returns { type: 'image', data, mediaType, label } or { type: 'video', frames, label }.
async function prepareCreative(file, tmpDir, tempPaths) {
  const label = file.originalname || 'Creative';
  if (isVideoFile(file)) {
    // ffmpeg needs the extension to identify the container
    const ext = (VIDEO_EXT.exec(file.originalname || '') || ['.mp4'])[0];
    const renamed = file.path + ext;
    fs.renameSync(file.path, renamed);
    tempPaths.push(renamed);
    const frames = await extractFrames(renamed, tmpDir);
    if (!frames.length) throw new Error(`No frames could be extracted from ${label}`);
    return { type: 'video', frames, label };
  }
  const { data, mediaType } = await compressImage(file.path, file.mimetype);
  return { type: 'image', data, mediaType, label };
}

function imageBlocks(creative) {
  if (!creative) return [];
  if (creative.type === 'video') {
    return creative.frames.map(b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }));
  }
  return [{ type: 'image', source: { type: 'base64', media_type: creative.mediaType || 'image/jpeg', data: creative.data } }];
}

module.exports = { prepareCreative, imageBlocks, isVideoFile };

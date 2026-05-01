import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { getSystemConfig, query, initDb } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max duration for vercel (ignored locally)

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const url = searchParams.get('url');
  const fileId = searchParams.get('fileId');
  const originalFilename = searchParams.get('filename') || 'Fichier_Local';
  const lang = searchParams.get('lang') || 'auto';
  
  if (!url && !fileId) {
    return new Response('URL or fileId missing', { status: 400 });
  }

  // Load Config
  let config = {
    whisperCommand: "whisper",
    whisperPath: "",
    whisperModel: "base",
    ytdlpCommand: "yt-dlp",
    ffmpegCommand: "ffmpeg"
  };
  try {
    const dbConfig = await getSystemConfig();
    if (dbConfig) {
      config = { ...config, ...dbConfig };
    }
  } catch (e) {
    console.error("Could not load DB config for whisper:", e);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (step, percent, data = null) => {
        const payload = JSON.stringify({ step, percent, data });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      try {
        const tempDir = os.tmpdir();
        const sessionId = Date.now().toString();
        let videoPath = path.join(tempDir, `nihon_${sessionId}.mp4`);
        const audioPath = path.join(tempDir, `nihon_${sessionId}.wav`);
        
        // Ensure permanent media directories exist
        const mediaDir = path.join(process.cwd(), 'media');
        const audioDestDir = path.join(mediaDir, 'audio');
        const videoDestDir = path.join(mediaDir, 'video');
        const subsDestDir = path.join(mediaDir, 'transcripts');
        await fs.mkdir(audioDestDir, { recursive: true }).catch(() => {});
        await fs.mkdir(videoDestDir, { recursive: true }).catch(() => {});
        await fs.mkdir(subsDestDir, { recursive: true }).catch(() => {});

        let videoTitle = "Vidéo YouTube";

        if (fileId) {
          videoPath = path.join(os.tmpdir(), fileId);
          videoTitle = originalFilename.replace(/\.[^/.]+$/, "");
          sendEvent(0, 100, { message: "Fichier local détecté, préparation..." });
        } else {
          // STEP 0: Fetch Title
          sendEvent(0, 0, { message: "Récupération du titre..." });
          
          // Anti-bot IP block workaround: Check if cookies.txt is provided by the user
          let antiBotArgs = [];
          const cookiesPath = path.join(process.cwd(), 'cookies.txt');
          try {
            await fs.access(cookiesPath);
            antiBotArgs = ['--cookies', cookiesPath];
            sendEvent(0, 0, { message: "Cookies YouTube détectés, contournement de l'anti-bot..." });
          } catch (e) {
            // No cookies file found, run standard
          }
          
          await new Promise((resolve) => {
            const ytdlpCommandStr = config.ytdlpCommand || "yt-dlp";
            const parts = ytdlpCommandStr.split(' ').filter(Boolean);
            const executable = parts[0];
            
            const titleProc = spawn(executable, [...parts.slice(1), ...antiBotArgs, '--print', 'title', url]);
            
            titleProc.stdout.on('data', (data) => {
              const title = data.toString().trim();
              if (title) videoTitle = title;
            });

            titleProc.on('close', () => resolve());
          });

          // STEP 1: yt-dlp
          sendEvent(0, 5, { message: "Téléchargement..." }); // start yt-dlp
          await new Promise((resolve, reject) => {
            const ytdlpCommandStr = config.ytdlpCommand || "yt-dlp";
            const parts = ytdlpCommandStr.split(' ').filter(Boolean);
            const executable = parts[0];
            const execArgs = [...parts.slice(1), ...antiBotArgs, '-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4', '-o', videoPath, url];

            const ytdlp = spawn(executable, execArgs);
            
            ytdlp.stdout.on('data', (data) => {
              const output = data.toString();
              // Parse yt-dlp progress: "[download]  45.0% of..."
              const match = output.match(/\[download\]\s+([\d\.]+)%/);
              if (match && match[1]) {
                sendEvent(0, parseFloat(match[1]));
              }
            });

            ytdlp.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error('yt-dlp failed'));
            });
          });
          sendEvent(0, 100);
        }

        // STEP 2: ffmpeg
        sendEvent(1, 0);
        await new Promise((resolve, reject) => {
          const ffmpegCommandStr = config.ffmpegCommand || "ffmpeg";
          const parts = ffmpegCommandStr.split(' ').filter(Boolean);
          const executable = parts[0];
          const execArgs = [...parts.slice(1), '-i', videoPath, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', audioPath];

          const ffmpeg = spawn(executable, execArgs);
          
          ffmpeg.stderr.on('data', (data) => {
            // ffmpeg output is usually on stderr, just fake progress based on time or just jump to 50%
            sendEvent(1, 50);
          });

          ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('ffmpeg failed'));
          });
        });
        sendEvent(1, 100);

        // STEP 3: Whisper
        sendEvent(2, 0);
        await new Promise((resolve, reject) => {
          const isCpp = config.whisperCommand.includes('whisper-cli') || config.whisperCommand.includes('./main') || config.whisperCommand.includes('main');
          
          let whisperArgs = [];
          if (isCpp) {
            // Whisper.cpp arguments
            whisperArgs = ['-m', config.whisperModel, '-f', audioPath, '-osrt'];
            // Prevent hallucination loop (very common in large-v3) by disabling context
            whisperArgs.push('-mc', '0');
            if (lang !== 'auto') {
              whisperArgs.push('-l', lang);
            }
          } else {
            // Python Whisper arguments
            whisperArgs = [audioPath, '--model', config.whisperModel, '--output_format', 'srt', '--output_dir', tempDir];
            if (lang !== 'auto') {
              whisperArgs.push('--language', lang);
            }
          }
          
          // Construct command
          let command = config.whisperCommand;
          let args = whisperArgs;
          
          // If whisperCommand contains spaces (like 'python main.py'), we need to split it
          const parts = command.split(' ').filter(Boolean);
          const executable = parts[0];
          args = [...parts.slice(1), ...args];

          const options = {};
          if (config.whisperPath) {
            options.cwd = config.whisperPath;
          }

          const whisper = spawn(executable, args, options);
          
          whisper.stdout.on('data', (data) => {
            const output = data.toString();
            // Whisper progress is hard to parse as a %, we'll just send 50% to show activity
            sendEvent(2, 50);
          });

          whisper.stderr.on('data', (data) => {
            // Whisper output might go to stderr
            sendEvent(2, 50);
          });

          whisper.on('close', async (code) => {
            if (code === 0) {
              try {
                // Whisper.cpp usually creates audio.wav.srt, Python creates audio.srt
                const txtPathPython = path.join(tempDir, `nihon_${sessionId}.srt`);
                const txtPathCpp = audioPath + '.srt'; // nihon_123.wav.srt
                
                let transcription = "";
                
                try {
                  transcription = await fs.readFile(txtPathCpp, 'utf8');
                } catch (e1) {
                  transcription = await fs.readFile(txtPathPython, 'utf8');
                }
                
                // Prepare final names
                // On garde le vrai titre (y compris les Kana/Kanji). On remplace juste les barres obliques pour ne pas créer de faux dossiers.
                const safeTitle = videoTitle.replace(/[/\\?%*:|"<>]/g, '-').trim();
                const finalAudioName = `${safeTitle}.wav`;
                const finalVideoName = `${safeTitle}.mp4`;
                const finalSubsName = `${safeTitle}.srt`;
                
                // Save files permanently
                try {
                  await fs.copyFile(audioPath, path.join(audioDestDir, finalAudioName));
                  let savedVideo = false;
                  try {
                    await fs.copyFile(videoPath, path.join(videoDestDir, finalVideoName));
                    savedVideo = true;
                  } catch (e) {
                    console.log("No video file to save or error:", e.message);
                  }
                  
                  // Copy whichever txt file exists
                  const finalSubsPath = path.join(subsDestDir, finalSubsName);
                  let finalSrtContent = "";
                  try {
                    finalSrtContent = await fs.readFile(txtPathCpp, 'utf8');
                    await fs.copyFile(txtPathCpp, finalSubsPath);
                  } catch (e1) {
                    try {
                      finalSrtContent = await fs.readFile(txtPathPython, 'utf8');
                      await fs.copyFile(txtPathPython, finalSubsPath);
                    } catch (e2) {}
                  }

                  // Generate Romaji version
                  if (finalSrtContent) {
                    sendEvent(2, 90, { message: "Génération des sous-titres Romaji..." });
                    try {
                      const KClass = Kuroshiro.default || Kuroshiro;
                      const kuroshiro = new KClass();
                      const dictPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
                      await kuroshiro.init(new KuromojiAnalyzer({ dictPath }));
                      
                      const lines = finalSrtContent.split('\n');
                      const romajiLines = [];
                      for (let line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || /^\d+$/.test(trimmed) || trimmed.includes('-->')) {
                          romajiLines.push(line);
                        } else {
                          const romaji = await kuroshiro.convert(line, { to: "romaji", mode: "spaced" });
                          romajiLines.push(romaji);
                        }
                      }
                      
                      const romajiSubsName = `${safeTitle}_romaji.srt`;
                      const romajiSubsPath = path.join(subsDestDir, romajiSubsName);
                      await fs.writeFile(romajiSubsPath, romajiLines.join('\n'));
                      
                      // Save to database
                      try {
                        await initDb();
                        await query(
                          `INSERT INTO whisper_sessions (title, audio_filename, video_filename, subs_content, romaji_content, language) VALUES (?, ?, ?, ?, ?, ?)`,
                          [videoTitle, finalAudioName, savedVideo ? finalVideoName : null, finalSrtContent, romajiLines.join('\n'), lang]
                        );
                      } catch (dbErr) {
                        console.error("Could not save to DB:", dbErr);
                      }
                      
                      sendEvent(3, 100, { 
                        text: transcription, 
                        title: videoTitle,
                        audioFile: finalAudioName,
                        videoFile: savedVideo ? finalVideoName : null,
                        transcriptFile: finalSubsName,
                        romajiFile: romajiSubsName
                      });
                      
                    } catch (romajiErr) {
                      console.error("Romaji conversion failed:", romajiErr);
                      // Fallback if romaji fails
                      sendEvent(3, 100, { 
                        text: transcription, 
                        title: videoTitle,
                        audioFile: finalAudioName,
                        videoFile: savedVideo ? finalVideoName : null,
                        transcriptFile: finalSubsName
                      });
                    }
                  } else {
                     sendEvent(3, 100, { 
                        text: transcription, 
                        title: videoTitle,
                        audioFile: finalAudioName,
                        videoFile: savedVideo ? finalVideoName : null,
                        transcriptFile: finalSubsName
                      });
                  }
                  
                } catch (saveErr) {
                  console.error("Could not save media files:", saveErr);
                }
                
                // Cleanup Temp Files
                fs.unlink(videoPath).catch(()=>{});
                fs.unlink(audioPath).catch(()=>{});
                fs.unlink(txtPathPython).catch(()=>{});
                fs.unlink(txtPathCpp).catch(()=>{});
                
                resolve();
              } catch (e) {
                reject(new Error('Failed to read transcript'));
              }
            } else {
              reject(new Error('whisper failed'));
            }
          });
          
          whisper.on('error', (err) => {
             reject(new Error(`Whisper Execution Error: ${err.message}. Verifiez votre configuration dans l'Admin.`));
          });
        });

        controller.close();
      } catch (error) {
        sendEvent(-1, 0, { error: error.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

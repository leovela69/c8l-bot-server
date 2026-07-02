export const dynamic = 'force-static';
// app/api/socket/route.ts (usando Next.js WebSocket)
import * as wsModule from 'ws';
import { NextRequest } from 'next/server';

let wss: any = null;

export async function GET(req: NextRequest) {
  if (!wss) {
    // @ts-ignore
    const server = (global as any).__websocket_server;
    if (!server) {
      return new Response('WebSocket server not ready', { status: 500 });
    }
    wss = new wsModule.WebSocketServer({ server });
    
    wss.on('connection', (ws: any) => {
      console.log('Cliente conectado para práctica vocal');
      
      ws.on('message', async (data: any) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'audio_chunk') {
          // Analizar chunk de audio
          const analysis = await analyzeAudioChunk(message.audio);
          ws.send(JSON.stringify({
            type: 'analysis',
            score: analysis
          }));
        }
      });
    });
  }
  
  return new Response('WebSocket server ready');
}

async function analyzeAudioChunk(audio: string): Promise<number> {
  return Math.floor(Math.random() * 30) + 70; // 70-100
}
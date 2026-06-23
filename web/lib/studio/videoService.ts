export interface VideoParams { prompt:string; duration:number; resolution:'720p'|'1080p'|'4k'; aspect_ratio:'16:9'|'9:16'|'1:1'; style?:string }
export const VIDEO_STYLES = [{id:'cinematic',label:'🎬 Cinematico'},{id:'cyberpunk',label:'🌃 Cyberpunk'},{id:'anime',label:'🎌 Anime'},{id:'3d',label:'🎨 3D'},{id:'realistic',label:'📷 Realista'}]
export const CAMERA_MOTIONS = [{id:'static',label:'Estatica'},{id:'pan',label:'Paneo'},{id:'zoom',label:'Zoom'},{id:'orbit',label:'Orbita'}]
export async function generateVideo(params:VideoParams) { await new Promise(r=>setTimeout(r,3000)); return {id:`vid_${Date.now()}`,status:'ready' as const,duration:params.duration} }

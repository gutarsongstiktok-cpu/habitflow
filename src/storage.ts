import type { AppData } from "./types";
import { saveRemote } from "./api";
const STORAGE_KEY="habitflow:data:v2";
export function loadLocal():AppData|null{try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw) as AppData:null}catch{return null}}
export function saveLocal(data:AppData){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch{}}
function cloud(){return (window as any)?.Telegram?.WebApp?.CloudStorage}
export async function loadCloud():Promise<AppData|null>{const cs=cloud();if(!cs?.getItem)return null;return new Promise(resolve=>{let done=false;const finish=(v:AppData|null)=>{if(!done){done=true;resolve(v)}};const timer=window.setTimeout(()=>finish(null),1200);try{cs.getItem(STORAGE_KEY,(_e:unknown,value:string)=>{window.clearTimeout(timer);if(!value)return finish(null);try{finish(JSON.parse(value) as AppData)}catch{finish(null)}})}catch{window.clearTimeout(timer);finish(null)}})}
export async function saveCloud(data:AppData){const cs=cloud();if(!cs?.setItem)return;await new Promise<void>(resolve=>{try{cs.setItem(STORAGE_KEY,JSON.stringify(data),()=>resolve())}catch{resolve()}})}
export async function saveEverywhere(data:AppData){saveLocal(data);void saveCloud(data);void saveRemote(data)}

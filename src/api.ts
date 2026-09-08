import WebApp from "@twa-dev/sdk";
import type { AppData } from "./types";
const API_URL=(import.meta.env.VITE_API_URL??"").replace(/\/$/,"");
const TOKEN_KEY="uphabit:session:v1";
export interface TelegramProfile{id:string;telegramId:string;username?:string;firstName?:string;lastName?:string;photoUrl?:string;languageCode?:string;telegramPremium?:boolean}
export interface AuthResponse{token:string;user:TelegramProfile;data:AppData;startParam:string|null}
export function getApiUrl(){return API_URL}
export function getSessionToken(){try{return localStorage.getItem(TOKEN_KEY)}catch{return null}}
export function setSessionToken(token:string){try{localStorage.setItem(TOKEN_KEY,token)}catch{}}
export function telegramInitData(){try{return String((WebApp as any).initData??"")}catch{return ""}}
export async function authenticate(defaultData:AppData):Promise<AuthResponse|null>{if(!API_URL)return null;const initData=telegramInitData();if(!initData)return null;const r=await fetch(`${API_URL}/api/auth/telegram`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({initData,defaultData})});if(!r.ok)throw new Error((await r.json().catch(()=>({})))?.error??"Telegram authentication failed");const x=await r.json() as AuthResponse;setSessionToken(x.token);return x}
export async function loadRemote(){if(!API_URL)return null;const token=getSessionToken();if(!token)return null;const r=await fetch(`${API_URL}/api/me`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)return null;return await r.json() as {user:TelegramProfile;data:AppData}}
export async function saveRemote(data:AppData){if(!API_URL)return false;const token=getSessionToken();if(!token)return false;const r=await fetch(`${API_URL}/api/me/data`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({data})});if(r.status===401){try{localStorage.removeItem(TOKEN_KEY)}catch{}}return r.ok}
export async function askAICoach(payload:{message:string;data:AppData;profile?:TelegramProfile|null}){if(!API_URL)throw new Error("AI backend is not configured");const token=getSessionToken();const r=await fetch(`${API_URL}/api/ai/coach`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(payload)});if(!r.ok)throw new Error((await r.json().catch(()=>({})))?.error??"AI Coach unavailable");return await r.json() as {text:string;model?:string}}

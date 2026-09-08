export interface GamificationData { xp:number; coins:number; achievements:string[]; events:string[]; claimedChallenges?:string[] }
export const DEFAULT_GAMIFICATION: GamificationData={xp:0,coins:0,achievements:[],events:[],claimedChallenges:[]};
export const ACHIEVEMENTS=[
{id:'first-habit',icon:'🌱',title:'Первый шаг',desc:'Выполнить первую привычку',xp:50},
{id:'first-task',icon:'✅',title:'Дело сделано',desc:'Выполнить первую задачу',xp:50},
{id:'perfect-day',icon:'🏆',title:'Идеальный день',desc:'Закрыть все привычки дня',xp:100},
{id:'week-streak',icon:'🔥',title:'7 дней подряд',desc:'Достичь серии 7 дней',xp:200},
{id:'month-streak',icon:'🗓️',title:'Месяц ритма',desc:'Достичь серии 30 дней',xp:500},
{id:'hundred-xp',icon:'⚡',title:'Разгон',desc:'Набрать 100 XP',xp:100},
{id:'thousand-xp',icon:'💎',title:'Тысяча XP',desc:'Набрать 1000 XP',xp:300},
{id:'finance-first',icon:'💰',title:'Финансовый контроль',desc:'Добавить первую операцию',xp:75},
{id:'goal-first',icon:'🎯',title:'Цель поставлена',desc:'Создать первую финансовую цель',xp:75},
];
export function levelFromXp(xp:number){return Math.floor(Math.sqrt(Math.max(0,xp)/100))+1}
export function levelStart(level:number){return Math.pow(Math.max(0,level-1),2)*100}
export function levelEnd(level:number){return Math.pow(level,2)*100}
export function levelProgress(xp:number){const level=levelFromXp(xp),start=levelStart(level),end=levelEnd(level);return{level,current:Math.max(0,xp-start),needed:end-start,pct:Math.min(100,Math.round((xp-start)/(end-start)*100))}}

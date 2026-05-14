export function calculateMarketScore(scores:number[]){
 return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)
}

export function canOpenTrade(balance:number,amount:number){
 return amount>0 && balance>=amount
}

export function formatMoney(value:number){
 return `$${value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`
}

export function calculatePnl(amount:number,entry:number,current:number,side:'LONG'|'SHORT'){
 const direction=side==='LONG'?1:-1;
 const move=(current-entry)/entry;
 return amount*move*direction*8;
}

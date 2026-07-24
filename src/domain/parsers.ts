import type {OCRParseResult,ParsedField,Platform} from '../types';
const n=(v:string)=>Number(v.replace(/\s/g,'').replace(',','.'));
const clean=(text:string)=>text.normalize('NFKC').replace(/[|]/g,'I').replace(/\r/g,'').replace(/\brnin\b/gi,'min').replace(/\bkrn\b/gi,'km').trim();
const money=/(?:MX\s*[$S]|[$S])\s*(\d{2,4}(?:[.,]\d{1,2})?)|\b(\d{2,4}(?:[.,]\d{1,2})?)\s*(?:MXN|pesos)\b/i;
const dist=/((?:\d{1,3})(?:[.,]\d{1,2})?)\s*k[mn]\b/gi;
const mins=/(?:(\d{1,2})\s*h(?:ora)?s?\s*)?(\d{1,3})\s*min(?:uto)?s?\b/gi;
// Formato habitual de las tarjetas: "7 min (1.6 km)" seguido del destino.
const routePair=/(?:(\d{1,2})\s*h(?:ora)?s?\s*)?(\d{1,3})\s*min(?:uto)?s?\s*(?:\(|\[)?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*k[mn]\s*(?:\)|\])?/gi;
const value=(m:RegExpMatchArray|null)=>m?n(m[1]||m[2]):undefined;
function base(rawText:string,platform:Platform):OCRParseResult{
 const text=clean(rawText), warnings:string[]=[], fieldConfidence:Partial<Record<ParsedField,number>>={};
 const offeredFare=value(text.match(money)); if(offeredFare!==undefined)fieldConfidence.offeredFare=.9;
 const pairs=[...text.matchAll(routePair)].map(x=>({duration:(x[1]?n(x[1])*60:0)+n(x[2]),distance:n(x[3])})).filter(x=>x.duration>0&&x.duration<600&&x.distance>.1&&x.distance<500);
 const ds=[...text.matchAll(dist)].map(x=>({v:n(x[1]),i:x.index||0})).filter(x=>x.v>.1&&x.v<500);
 const ts=[...text.matchAll(mins)].map(x=>({v:(x[1]?n(x[1])*60:0)+n(x[2]),i:x.index||0})).filter(x=>x.v>0&&x.v<600);
 const context=(i:number)=>text.slice(Math.max(0,i-35),i+30).toLowerCase();
 const pickD=ds.find(x=>/recog|pasaj|llegar|pickup/.test(context(x.i))); const tripD=ds.find(x=>x!==pickD&&/viaje|destino|trayecto/.test(context(x.i)))||ds.find(x=>x!==pickD);
 const pickT=ts.find(x=>/recog|pasaj|llegar|pickup/.test(context(x.i))); const tripT=ts.find(x=>x!==pickT&&/viaje|destino|trayecto/.test(context(x.i)))||ts.find(x=>x!==pickT);
 const ordered=pairs.length>=2; const pickupDistanceKm=ordered?pairs[0].distance:pickD?.v; const tripDistanceKm=ordered?pairs[1].distance:tripD?.v; const pickupDurationMin=ordered?pairs[0].duration:pickT?.v; const tripDurationMin=ordered?pairs[1].duration:tripT?.v;
 if(pickupDistanceKm!==undefined)fieldConfidence.pickupDistanceKm=ordered ? 0.96 : 0.82;if(tripDistanceKm!==undefined)fieldConfidence.tripDistanceKm=ordered ? 0.96 : 0.78;if(pickupDurationMin!==undefined)fieldConfidence.pickupDurationMin=ordered ? 0.96 : 0.82;if(tripDurationMin!==undefined)fieldConfidence.tripDurationMin=ordered ? 0.96 : 0.78;
 if(ds.length>2)warnings.push('Se detectaron varias distancias; revisa los datos.'); if(ts.length>2)warnings.push('Se detectaron varios tiempos; revisa los datos.');
 const values=Object.values(fieldConfidence);return{platform,offeredFare,pickupDistanceKm,tripDistanceKm,pickupDurationMin,tripDurationMin,confidence:values.length?values.reduce((a,b)=>a+b,0)/5:0,fieldConfidence,warnings,rawText};
}
export interface TripParser{parse(text:string):OCRParseResult}
export class UberParser implements TripParser{parse(t:string){return base(t,'uber')}}
export class DidiParser implements TripParser{parse(t:string){return base(t,'didi')}}
export class GenericParser implements TripParser{parse(t:string){return base(t,'other')}}
export function parseOCR(text:string,preferred:'auto'|Platform='auto'){
 const low=text.toLowerCase(); const platform=preferred==='auto'?(low.includes('didi')?'didi':low.includes('uber')?'uber':'other'):preferred;
 return platform==='uber'?new UberParser().parse(text):platform==='didi'?new DidiParser().parse(text):new GenericParser().parse(text);
}

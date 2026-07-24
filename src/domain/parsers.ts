import type {OCRParseResult,ParsedField,Platform} from '../types';
const n=(v:string)=>Number(v.replace(/\s/g,'').replace(',','.'));
const clean=(text:string)=>text.normalize('NFKC').replace(/[|]/g,'I').replace(/\r/g,'').trim();
const money=/(?:MX\$|\$)\s*(\d{2,4}(?:[.,]\d{1,2})?)|\b(\d{2,4}(?:[.,]\d{1,2})?)\s*(?:MXN|pesos)\b/i;
const dist=/((?:\d{1,3})(?:[.,]\d{1,2})?)\s*k[mn]\b/gi;
const mins=/(?:(\d{1,2})\s*h(?:ora)?s?\s*)?(\d{1,3})\s*min(?:uto)?s?\b/gi;
const value=(m:RegExpMatchArray|null)=>m?n(m[1]||m[2]):undefined;
function base(rawText:string,platform:Platform):OCRParseResult{
 const text=clean(rawText), warnings:string[]=[], fieldConfidence:Partial<Record<ParsedField,number>>={};
 const offeredFare=value(text.match(money)); if(offeredFare!==undefined)fieldConfidence.offeredFare=.9;
 const ds=[...text.matchAll(dist)].map(x=>({v:n(x[1]),i:x.index||0})).filter(x=>x.v>.1&&x.v<500);
 const ts=[...text.matchAll(mins)].map(x=>({v:(x[1]?n(x[1])*60:0)+n(x[2]),i:x.index||0})).filter(x=>x.v>0&&x.v<600);
 const context=(i:number)=>text.slice(Math.max(0,i-35),i+30).toLowerCase();
 const pickD=ds.find(x=>/recog|pasaj|llegar|pickup/.test(context(x.i))); const tripD=ds.find(x=>x!==pickD&&/viaje|destino|trayecto/.test(context(x.i)))||ds.find(x=>x!==pickD);
 const pickT=ts.find(x=>/recog|pasaj|llegar|pickup/.test(context(x.i))); const tripT=ts.find(x=>x!==pickT&&/viaje|destino|trayecto/.test(context(x.i)))||ts.find(x=>x!==pickT);
 if(pickD)fieldConfidence.pickupDistanceKm=.82;if(tripD)fieldConfidence.tripDistanceKm=.78;if(pickT)fieldConfidence.pickupDurationMin=.82;if(tripT)fieldConfidence.tripDurationMin=.78;
 if(ds.length>2)warnings.push('Se detectaron varias distancias; revisa los datos.'); if(ts.length>2)warnings.push('Se detectaron varios tiempos; revisa los datos.');
 const values=Object.values(fieldConfidence);return{platform,offeredFare,pickupDistanceKm:pickD?.v,tripDistanceKm:tripD?.v,pickupDurationMin:pickT?.v,tripDurationMin:tripT?.v,confidence:values.length?values.reduce((a,b)=>a+b,0)/5:0,fieldConfidence,warnings,rawText};
}
export interface TripParser{parse(text:string):OCRParseResult}
export class UberParser implements TripParser{parse(t:string){return base(t,'uber')}}
export class DidiParser implements TripParser{parse(t:string){return base(t,'didi')}}
export class GenericParser implements TripParser{parse(t:string){return base(t,'other')}}
export function parseOCR(text:string,preferred:'auto'|Platform='auto'){
 const low=text.toLowerCase(); const platform=preferred==='auto'?(low.includes('didi')?'didi':low.includes('uber')?'uber':'other'):preferred;
 return platform==='uber'?new UberParser().parse(text):platform==='didi'?new DidiParser().parse(text):new GenericParser().parse(text);
}

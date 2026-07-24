import type {Classification,OCRParseResult,ParsedField,TripAnalysis,TripMetrics,VehicleSettings} from '../types';
const safe=(a:number,b:number)=>b>0?a/b:0;
export function analyzeTrip(parse:OCRParseResult,s:VehicleSettings):TripAnalysis{
 const required:ParsedField[]=['offeredFare','tripDistanceKm','tripDurationMin']; const missing=required.filter(k=>parse[k]===undefined||Number(parse[k])<=0);
 if(missing.length)return{parse,classification:'insufficient',reasons:['Faltan datos esenciales para calcular.'],missingFields:missing};
 const pickupD=s.includePickupDistance?(parse.pickupDistanceKm||0):0,pickupT=s.includePickupTime?(parse.pickupDurationMin||0):0;
 const d=pickupD+parse.tripDistanceKm!,min=pickupT+parse.tripDurationMin!+s.extraMinutes;
 if(d<=0||min<=0)return{parse,classification:'insufficient',reasons:['Distancia o tiempo inválidos.'],missingFields:[]};
 const fuelLiters=d/s.fuelEfficiencyKmPerLiter,fuelCost=fuelLiters*s.fuelPricePerLiter,maintenanceCost=d*s.maintenanceCostPerKm,additionalCost=d*s.additionalCostPerKm;
 const contingencyCost=(fuelCost+maintenanceCost+additionalCost)*s.contingencyPercent/100,estimatedTotalCost=fuelCost+maintenanceCost+additionalCost+contingencyCost,estimatedNetProfit=parse.offeredFare!-estimatedTotalCost,h=min/60;
 const metrics:TripMetrics={totalDistanceKm:d,totalDurationMin:min,fuelLiters,fuelCost,maintenanceCost,additionalCost,contingencyCost,estimatedTotalCost,estimatedNetProfit,grossPerKm:safe(parse.offeredFare!,d),netPerKm:safe(estimatedNetProfit,d),grossPerHour:safe(parse.offeredFare!,h),netPerHour:safe(estimatedNetProfit,h)};
 const km=metrics.netPerKm>=s.thresholds.minNetPerKm,hr=metrics.netPerHour>=s.thresholds.minNetPerHour,t=1-s.thresholds.regularTolerancePercent/100;let classification:Classification;
 if(estimatedNetProfit<=0)classification='unprofitable';else if(km&&hr)classification='profitable';else if((metrics.netPerKm>=s.thresholds.minNetPerKm*t&&hr)||(metrics.netPerHour>=s.thresholds.minNetPerHour*t&&km)||km!==hr)classification='regular';else classification='unprofitable';
 const reasons=[km?'Cumple la meta neta por km.':`No alcanza la meta de ${s.thresholds.minNetPerKm}/km.`,hr?'Cumple la meta neta por hora.':`No alcanza la meta de ${s.thresholds.minNetPerHour}/h.`];
 return{parse,metrics,classification,reasons,missingFields:[]};
}
export const titles:Record<Classification,string>={profitable:'🟢 SÍ CONVIENE',regular:'🟡 REGULAR',unprofitable:'🔴 NO CONVIENE',insufficient:'⚪ REVISA LOS DATOS'};

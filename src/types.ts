export type Platform='uber'|'didi'|'other';
export type Classification='profitable'|'regular'|'unprofitable'|'insufficient';
export type DriverDecision='accepted'|'rejected'|'pending';
export interface VehicleSettings{name:string;country:string;currency:string;fuelType:string;fuelPricePerLiter:number;fuelEfficiencyKmPerLiter:number;maintenanceCostPerKm:number;additionalCostPerKm:number;contingencyPercent:number;extraMinutes:number;includePickupDistance:boolean;includePickupTime:boolean;syncCode:string;thresholds:ProfitabilityThresholds;theme:'dark'|'light'|'system'}
export interface ProfitabilityThresholds{minNetPerKm:number;minNetPerHour:number;regularTolerancePercent:number}
export type ParsedField='offeredFare'|'pickupDistanceKm'|'tripDistanceKm'|'pickupDurationMin'|'tripDurationMin';
export interface OCRParseResult{platform:Platform;offeredFare?:number;pickupDistanceKm?:number;tripDistanceKm?:number;pickupDurationMin?:number;tripDurationMin?:number;confidence:number;fieldConfidence:Partial<Record<ParsedField,number>>;warnings:string[];rawText:string}
export interface TripMetrics{totalDistanceKm:number;totalDurationMin:number;fuelLiters:number;fuelCost:number;maintenanceCost:number;additionalCost:number;contingencyCost:number;estimatedTotalCost:number;estimatedNetProfit:number;grossPerKm:number;netPerKm:number;grossPerHour:number;netPerHour:number}
export interface TripAnalysis{parse:OCRParseResult;metrics?:TripMetrics;classification:Classification;reasons:string[];missingFields:ParsedField[]}
export interface AnalysisHistoryItem{ id:string;createdAt:string;analysis:TripAnalysis;driverDecision:DriverDecision }
export interface APIRequest{text:string;platform?:'auto'|Platform;deviceId?:string;deviceID?:string;device_id?:string;deviceid?:string;save?:boolean|string;token?:string}
export interface APIResponse{success:boolean;classification:Classification;title:string;summary:string;data?:Record<string,string|number>;warnings?:string[];missingFields?:ParsedField[]}
export type TripDecision=Classification;

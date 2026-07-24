import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'prompt',includeAssets:['icon.svg'],manifest:{name:'¿Conviene? — Analizador de viajes',short_name:'¿Conviene?',description:'Estima la rentabilidad de solicitudes de viaje.',theme_color:'#080a0b',background_color:'#080a0b',display:'standalone',orientation:'portrait-primary',lang:'es-MX',start_url:'/',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{navigateFallback:'/index.html',globPatterns:['**/*.{js,css,html,svg}']}})]});

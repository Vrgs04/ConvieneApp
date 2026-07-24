# ¿Conviene?

PWA móvil para estimar la rentabilidad de solicitudes de viaje a partir del texto extraído por Atajos de iOS. No lee la pantalla de otras aplicaciones ni usa overlays.

## Desarrollo local

Requisitos: Node.js 20 o posterior.

```bash
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

La interfaz de Vite funciona sin infraestructura externa y guarda configuración e historial en IndexedDB. Para probar también la función de Cloudflare:

```bash
copy .env.example .dev.vars
# Edite API_TOKEN en .dev.vars
npm run build
npx wrangler pages dev dist
```

Prueba de API (PowerShell):

```powershell
$body = @{ text='Uber MX$180 Recoger a 3.2 km 8 min Viaje de 12 km 44 min'; platform='auto'; save=$false } | ConvertTo-Json
Invoke-RestMethod http://localhost:8788/api/analyze -Method Post -Headers @{ Authorization='Bearer SU_TOKEN' } -ContentType application/json -Body $body
```

También acepta `application/x-www-form-urlencoded` y `?format=text`. El token puede ir como `Authorization: Bearer …` o como campo `token`, útil en Atajos.

## Arquitectura

- `src/domain`: parsers modulares y cálculo puro compartido.
- `src/data`: repositorio local IndexedDB.
- `functions/api/analyze.ts`: endpoint protegido, validado y limitado a 30 solicitudes/minuto por IP.
- `migrations`: esquema D1 opcional.
- PWA: manifest generado, service worker con caché del shell, modo standalone y actualización controlada.

El historial local nunca guarda capturas. Tesseract.js se descarga únicamente al elegir una imagen y el resultado queda en el navegador. El modo demo/local no requiere cuenta.

## Cloudflare Pages y D1

1. Cree un proyecto Pages conectado al repositorio.
2. Use `npm run build` y directorio de salida `dist`.
3. En Settings → Variables, cree el secreto `API_TOKEN` (largo y aleatorio).
4. Opcional: `npx wrangler d1 create conviene-db`, copie el ID a un binding D1 llamado `DB` y ejecute `npx wrangler d1 migrations apply conviene-db --remote`.
5. Despliegue con la integración Git o `npx wrangler pages deploy dist`.

Sin el binding `DB`, `save: true` sigue devolviendo el análisis pero no persiste remotamente. La configuración del conductor no se envía a la API en este MVP: el endpoint usa las estimaciones documentadas de `DEFAULT_SETTINGS`. Para producción personal, ajuste esos valores en el código o añada un perfil autenticado. El panel es local y no expone el secreto.

## Atajo de iOS

La pantalla “Configurar Atajo” contiene el flujo completo. Resumen:

1. Abrir Uber o DiDi.
2. Esperar 1 segundo.
3. Tomar captura.
4. Extraer texto de la imagen.
5. Obtener contenido de `https://convieneapp.pages.dev/api/analyze?format=text` por POST.
6. Cuerpo JSON con `text` (variable azul “Texto de la imagen”), `platform`, `token` y `save`.
7. Añadir “Mostrar notificación” y usar como contenido la variable “Contenido de URL”.
8. Opcionalmente, añadir también “Mostrar resultado”.

Duplique el Atajo para la segunda plataforma. Añádalo al Centro de control desde su editor. Configure y pruebe todo con el vehículo estacionado; nunca use el teléfono mientras conduce.

El botón “Activar notificaciones” de la pantalla Inicio habilita avisos para análisis ejecutados dentro de la PWA. Los análisis iniciados desde Uber o DiDi deben usar “Mostrar notificación” dentro del Atajo: es la vía nativa más confiable y no depende de mantener abierta la PWA.

## OCR de capturas

El analizador ofrece botones separados para elegir una imagen de la galería o abrir la cámara. En capturas verticales recorta la zona probable de la tarjeta, aumenta resolución y contraste, y ejecuta una segunda pasada dedicada a la tarifa. Las imágenes no se guardan. La detección reconoce el formato ordenado `tiempo (km)`: el primer par corresponde a recogida y el segundo al trayecto del pasajero.

## Instalación en iPhone

Abra la URL en Safari, toque Compartir y “Añadir a pantalla de inicio”. La PWA calcula y consulta datos locales sin conexión; el Atajo y el OCR de primera carga requieren conexión. En escritorio se puede instalar desde el menú del navegador.

## Privacidad, seguridad y limitaciones

- `API_TOKEN` vive solo en Cloudflare y en el Atajo; nunca use un nombre `VITE_*`.
- La API valida tipo y longitud (máximo 15,000 caracteres), no registra OCR completo y añade encabezados defensivos.
- D1 guarda solo campos del análisis y un resumen; no guarda capturas ni el texto OCR completo.
- El parser usa heurísticas y no garantiza OCR perfecto. Siempre revise datos ambiguos.
- Las cifras son estimaciones, no ingresos o ganancias reales. Tráfico, impuestos, propinas y costos no contemplados pueden cambiar el resultado.
- El rate limit en memoria es básico y por instancia; para mayor escala use Cloudflare Rate Limiting.
- La autenticación del panel queda separada: el MVP personal funciona localmente. Cloudflare Access es la opción recomendada para restringir la URL publicada sin incorporar credenciales al frontend.

## Validación PWA

Después de `npm run build`, ejecute `npx wrangler pages dev dist`, abra DevTools → Application y compruebe Manifest, Service Worker y una recarga en modo Offline. Pruebe además a 390 × 844 px en orientación vertical.

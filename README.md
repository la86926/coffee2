# Mi café · Prensa francesa

Web personal que explica **mi** método para preparar café con prensa francesa:
dos aguas, cinco utensilios y diez pasos.

**Sitio:** https://la86926.github.io/coffee2/

## Estructura

```
index.html              Contenido completo (10 pasos, utensilios, alternativas)
css/styles.css          Sistema visual (tokens claro/oscuro del archivo de Figma)
js/app.js               Hoja de detalle, cronómetros, tema, zoom, navegación
sw.js                   Service worker ligero (funciona sin conexión, sin cachear videos)
manifest.webmanifest    PWA instalable
icons/                  Iconos de la app (SVG + PNG + apple-touch-icon)
img/                    Portadas WebP extraídas de los videos y fotos de los utensilios
videos/                 coffee1.mp4 … coffee10.mp4 + coffee-completo.mp4 (optimizados)
```

## Decisiones

- **Videos:** MP4 locales H.264 540×960, `faststart`, `preload="none"`. Solo se cargan
  cuando el visitante abre un paso. 11.7 MB en total (los originales pesaban ~183 MB).
  Cada paso enlaza además a su versión en YouTube.
- **Portadas:** fotogramas elegidos de cada video (p. ej. paso 1 a 2.8 s, paso 4 a 16.8 s),
  exportados en WebP en tres tamaños: miniatura, tarjeta 4:5 y póster 9:16.
- **Cronómetros:** paso 3 (2:00) y paso 8 (4:00 por defecto, o 5:00). Iniciar, pausar,
  reiniciar; píldora flotante mientras corren; vibración, sonido y pantalla encendida
  (Wake Lock) cuando el navegador lo permite. En mi preparación real uso el celular.
- **Zoom bloqueado** (experiencia tipo app): viewport sin escala, `touch-action: manipulation`,
  y se evitan pinch, doble toque, Ctrl/Cmd + rueda y Ctrl/Cmd + +/−/0.
- **Sin librerías:** HTML, CSS y JavaScript puros.

## Actualizar

Al cambiar CSS o JS, sube el número de versión en `index.html` (`?v=`) y en `sw.js`
(`VERSION` y la lista `SHELL`) para que los navegadores reciban la versión nueva.

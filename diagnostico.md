# Expediente Diagnóstico: Frank's Outfit Game

## 1. Problemas con la carga de Módulos (Vite)
**Estado:** Resuelto ✅
**Descripción:** Vite mostraba advertencias y errores (Ej: `The above dynamic import cannot be analyzed by Vite`) debido a que las escenas (`BuilderScene`, `QuizScene`, etc.) se importaban utilizando una variable dinámica en un bucle `.forEach` en `BootScene.js`.
**Solución Aplicada:** Modifiqué `BootScene.js` para cargar explícitamente y de manera estática las escenas con `import('./NombreEscena.js')`. Esto permite que Vite las incluya correctamente en el bundle.

## 2. Imágenes de UI y Prendas Faltantes (Assets Missing)
**Estado:** Identificado ⚠️
**Descripción:** En la consola y logs del servidor de Vite aparecen numerosos errores `Failed to process file` correspondientes a imágenes como `btn-play`, `btn-history`, y todos los `garment_*.png` (ej. `garment_camisa-formal.png`).
Tras revisar el directorio del proyecto, comprobé que las carpetas `public/assets/garments/` y `public/assets/ui/` **están vacías**.
**Impacto y Recomendación:** 
- Afortunadamente, componentes como `UIButton` y `BuilderScene` están programados a prueba de fallos y utilizan formas geométricas (rectángulos y texto) como "placeholders" si no encuentran la imagen. Por lo tanto, el juego **no crashea**.
- **Solución:** Se deben generar o conseguir los sprites de las 20 prendas y agregarlos a `public/assets/garments/`. Para los botones de la UI, dado que `UIButton` ya los dibuja vectorialmente, podríamos eliminar las líneas en `BootScene.js` que intentan cargar las imágenes `btn-*.png` si no se planea usarlas.

## 3. Posicionamiento de la Interfaz (Mejora de Botones)
**Estado:** Sugerencia de Mejora 💡
**Descripción:** Revisando escenas como `MenuScene.js` o `BuilderScene.js`, los botones utilizan coordenadas "hardcodeadas" (valores fijos). Por ejemplo:
- Botón "Play" en `width / 2, 320`.
- Botones de "Idioma" y "Volumen" anclados con pequeños márgenes como `width - 100, height - 50`.
**Solución Recomendada:**
1. Emplear un cálculo proporcional (ej. `height * 0.6`) en lugar de píxeles estáticos para el menú, asegurando que se vea bien independientemente de la resolución de la ventana o del dispositivo.
2. Agrupar los botones en un `Phaser.GameObjects.Container` para administrar el espaciado global o utilizar un plugin de UI para Phaser (como `RexUI`) que facilita el diseño responsivo.
3. El botón "Remover Prenda" (`removeBtn`) en `BuilderScene.js` está atado a `mannequinY - 200`, lo cual podría superponerse con los textos superiores dependiendo de la altura de la pantalla. Deberíamos revisar las anclas.

---
**Próximos pasos recomendados:** 
¿Te gustaría que genere algunos "placeholders" visuales utilizando código para las prendas, que limpie la carga inútil de imágenes UI, o prefieres ajustar primero el sistema de coordenadas responsivas de los botones?

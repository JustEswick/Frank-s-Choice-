# Matriz de Trazabilidad - Bugs Reportados

## Bugs Identificados

| ID | Bug | Escena | Archivo | Severidad | Estado |
|----|-----|--------|---------|-----------|--------|
| B1 | No se pueden clickear tabs de categorías (Inferior, Calzado, etc.) | BuilderScene | BuilderScene.js | Alta | Fix aplicado (depth + logging) |
| B2 | Texto del diálogo no alineado correctamente (cortado a la izquierda) | QuizScene | QuizScene.js | Media | Fix aplicado (origin + align) |

## Fixes Aplicados

### Fix B2: Texto del diálogo centrado

**Archivo:** `src/scenes/QuizScene.js`

**Antes:**
```js
this.dialogueText = this.add.text(40, height - 120, '', {
  fontFamily: 'Inter',
  fontSize: '18px',
  color: '#F5E6D3',
  wordWrap: { width: width * 0.84 },
  lineSpacing: 6
});
```

**Después:**
```js
this.dialogueText = this.add.text(width / 2, height - 110, '', {
  fontFamily: 'Inter',
  fontSize: '18px',
  color: '#F5E6D3',
  wordWrap: { width: width * 0.82 },
  lineSpacing: 6,
  align: 'center'
}).setOrigin(0.5);
```

**Causa raíz:** El texto estaba posicionado en x=40 pero el cuadro de diálogo empieza en x=64 (width/2 - width*0.9/2). El texto estaba FUERA del cuadro.

**Solución:** Centrar el texto en x=width/2 con `setOrigin(0.5)` y `align: 'center'`.

### Fix B1: Tabs con depth explícito (en pruebas)

**Archivo:** `src/scenes/BuilderScene.js`

**Cambios:**
1. Agregado `setDepth(100)` a los rectángulos de los tabs
2. Agregado `setDepth(101)` a los labels de los tabs
3. Agregado `setDepth(10)` a los thumbnails
4. Agregado `setDepth(1)` al maniquí
5. Agregado logging diagnóstico para verificar interacción

**Hipótesis:** Los tabs estaban siendo renderizados detrás de otros elementos o el input no estaba llegando a ellos.

**Estado:** Esperando pruebas del usuario.

## Matriz de Trazabilidad

| Requisito | Feature | Archivo | Estado |
|-----------|---------|---------|--------|
| R1: Tabs clickeables | BuilderScene categorías | BuilderScene.js:65-99 | ❌ Bug B1 |
| R2: Selección de categoría | Cambiar thumbnails | BuilderScene.js:118-172 | ❌ Bug B1 |
| R3: Texto de diálogo visible | QuizScene preguntas | QuizScene.js:38-44 | ❌ Bug B2 |
| R4: Maniquí interactivo | BuilderScene outfit | BuilderScene.js:174-219 | ✅ Funcional |
| R5: Preguntas adaptables | QuizScene flow | QuizScene.js:140-160 | ✅ Funcional |
| R6: Comparación final | RevealScene | RevealScene.js | ✅ Funcional |
| R7: Historial | HistoryScene | HistoryScene.js | ✅ Funcional |
| R8: Persistencia | localStorage | PersistenceManager.js | ✅ Funcional |
| R9: i18n | ES/EN | i18n.js | ✅ Funcional |
| R10: Audio | Music + SFX | AudioManager.js | ✅ Funcional |

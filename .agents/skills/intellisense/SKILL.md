---
name: intellisense
description: Detecta y corrige sugerencias/diagnósticos de IntelliSense y del editor (p. ej. Tailwind CSS suggestCanonicalClasses, clases arbitrarias con equivalente canónico, avisos de tipado o imports reportados). Úsalo cuando el usuario comparta diagnósticos del editor o pida revisar/aplicar sugerencias similares en el proyecto.
disable-model-invocation: false
argument-hint: "[diagnóstico, archivo o patrón a revisar]"
---

# /intellisense — Atender sugerencias de IntelliSense

Esta skill guía para **aplicar sugerencias de IntelliSense/diagnósticos del editor** de forma consistente y segura en el proyecto.

## Cuándo usarla

- El usuario comparte diagnósticos del editor (Tailwind CSS IntelliSense, TypeScript, ESLint en el editor, etc.).
- El usuario pide “atender”, “aplicar” o “tomar en cuenta” sugerencias de IntelliSense.
- Se detecta un patrón corregible (p. ej. clases arbitrarias con equivalente canónico) y se pide revisar casos similares en todo el proyecto.

## Flujo

1. **Entender el diagnóstico**
   - Identificar archivo, línea, regla/código (p. ej. `suggestCanonicalClasses`), mensaje y el cambio sugerido.
   - Confirmar que la sugerencia es equivalente semánticamente (no cambia el diseño/comportamiento esperado).

2. **Corregir el caso reportado**
   - Aplicar el reemplazo mínimo y preciso en el/los archivos afectados.
   - Mantener fidelidad visual y convenciones del proyecto.

3. **Buscar problemas similares en el proyecto**
   - Buscar el mismo patrón en el código relevante (p. ej. `app/`, componentes), evitando carpetas generadas (`node_modules`, `.next`, etc.).
   - Priorizar equivalencias seguras y obvias (ejemplos comunes en Tailwind: `rounded-[16px]` → `rounded-2xl`, `rounded-[24px]` → `rounded-3xl`).
   - No hacer refactors masivos ni cambiar valores arbitrarios intencionales de diseño sin una equivalencia canónica clara.

4. **Verificar**
   - Ejecutar validaciones disponibles según aplique: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
   - Revisar que no haya regresiones visuales/funcionales en los archivos tocados.

5. **Reportar**
   - Listar archivos modificados y reemplazos realizados.
   - Indicar si se revisó el proyecto en busca de casos similares y si quedaron sugerencias sin atender (y por qué).

## Reglas

- Preferir cambios **canónicos y equivalentes**; si una clase arbitraria es necesaria para el diseño, no forzar su reemplazo.
- Agrupar correcciones del mismo patrón para mantener consistencia.
- No introducir cambios de comportamiento, lógica o alcance no solicitado.
- Si una sugerencia es ambigua o puede alterar el resultado, pedir confirmación antes de aplicarla.

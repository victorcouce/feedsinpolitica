# NoPoliticsPlease

Extensión de Chrome que oculta publicaciones políticas en redes sociales, de forma **local y reversible**. Menos ruido. Más calma.

- **Todo ocurre en tu navegador.** Sin servidor, sin cuentas, sin analítica y sin conexiones de red propias. Más detalles en [PRIVACY.md](PRIVACY.md).
- **Reversible.** No elimina nada de las plataformas: sustituye cada publicación por una tarjeta compacta con un botón *Mostrar*. Al desactivar el filtro todo vuelve a su estado habitual sin recargar.
- **Transparente.** Pasa el ratón por una tarjeta para ver con qué coincide.

## Redes compatibles

| Red | Sitios |
|---|---|
| X | x.com, twitter.com |
| YouTube | www.youtube.com, m.youtube.com |
| Reddit | www.reddit.com, old.reddit.com |
| Bluesky | bsky.app |
| Menéame | www.meneame.net, meneame.net |
| Threads | www.threads.com, www.threads.net |
| Mastodon | mastodon.social, mastodon.online, mas.to |
| LinkedIn | www.linkedin.com |

En cualquier otro sitio la extensión no se ejecuta.

## Uso

Desde el popup de la extensión puedes:

- **Activar o desactivar** el filtro (desactivado por defecto).
- Elegir el **nivel**: *Suave* (solo contenido claramente electoral o partidista) o *Amplio* (incluye política institucional; puede ocultar algo ambiguo).
- Elegir la **duración**: 30 min, 2 h, 8 h o sin límite. Al terminar, el filtro se desactiva solo.
- Habilitar o deshabilitar el filtro **por red**.
- Ver cuántas publicaciones se han ocultado en la pestaña actual y el total acumulado (reiniciable).

## Cómo funciona

Un clasificador por reglas, en español, puntúa el texto visible de cada publicación (y, según la red, título, canal, texto alternativo o publicación citada) contra una lista de términos incluida en la extensión. Las reglas se agrupan en cinco categorías: actores, procesos electorales, instituciones, expresiones políticas y debates. Los términos ambiguos solo cuentan junto a otra señal, y las listas de partidos y líderes cubren el espectro con el mismo peso.

El sistema es automático y puede equivocarse en ambos sentidos.

## Desarrollo

Requisitos: Node 22 (ver `.nvmrc`).

```bash
npm install        # instala dependencias y ejecuta `wxt prepare`
npm run dev        # modo desarrollo con recarga (abre Chrome)
npm run build      # build de producción en .output/
npm run zip        # genera el .zip para Chrome Web Store
npm run compile    # comprobación de tipos (tsc --noEmit)
npm test           # tests con Vitest
```

Para cargar el build manualmente: `chrome://extensions` → activar *Modo desarrollador* → *Cargar descomprimida* → `.output/chrome-mv3`.

### Estructura

```
entrypoints/          Entradas de WXT: background, popup (React) y un content script por red
src/core/classifier/  Normalización, reglas y clasificación
src/core/content/     Controlador del content script, tarjetas y tema claro/oscuro
src/platforms/        Adaptador por red y registro de sitios
src/features/sessions Lógica de sesiones temporales
src/storage/          Ajustes y contador en chrome.storage.local
tests/                Tests unitarios y de integración
```

### Añadir una red

1. Crea el adaptador en `src/platforms/<red>/adapter.ts` (ver `create-adapter.ts`).
2. Regístralo, con sus direcciones, en `src/platforms/registry.ts`.
3. Añade `entrypoints/<red>.content.ts`.
4. Actualiza la tabla de [PRIVACY.md](PRIVACY.md) y añade tests en `tests/integration/platforms.test.ts`.

Stack: [WXT](https://wxt.dev), React 19 y TypeScript.

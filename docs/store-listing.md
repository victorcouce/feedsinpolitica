# Ficha de Chrome Web Store: FeedSinPolítica

## Nombre
FeedSinPolítica

## Resumen (máx. 132 caracteres)
Oculta publicaciones políticas de tu feed, de forma local y reversible. Sin cuentas ni servidores. Menos ruido, más calma.

## Categoría
Productividad (alternativa: Redes sociales)

## Idioma
Español

## Descripción detallada

¿Harto de política en tu feed? FeedSinPolítica oculta las publicaciones políticas mientras navegas, sin que tengas que dejar de usar tus redes.

CÓMO FUNCIONA
Cuando activas el filtro, la extensión analiza el texto visible de cada publicación con un clasificador por reglas incluido en la propia extensión. Las que tratan de política o elecciones se sustituyen por una tarjeta compacta con un botón "Mostrar". Pasa el ratón por la tarjeta para ver con qué ha coincidido.

CONTROLES DESDE EL POPUP
• Activa o desactiva el filtro (desactivado por defecto).
• Nivel Suave (solo contenido claramente electoral o partidista) o Amplio (incluye política institucional; puede ocultar algo ambiguo).
• Duración: 30 min, 2 h, 8 h o sin límite. Al terminar, el filtro se desactiva solo.
• Habilita o deshabilita el filtro en cada red.
• Contador de publicaciones ocultadas en la pestaña actual y total acumulado.

PRIVACIDAD
• Todo ocurre en tu navegador: sin servidor, sin cuentas, sin analítica y sin conexiones de red propias.
• No guarda el contenido de las publicaciones, tu historial ni datos personales.
• Solo guarda tus preferencias y un contador en tu navegador.

REVERSIBLE
No elimina nada de las plataformas. Solo oculta visualmente en tu pantalla. Al desactivar el filtro, todo vuelve a su estado habitual sin recargar la página.

LIMITACIONES
Funciona en ocho redes sociales y de noticias populares; en cualquier otro sitio no se ejecuta. El sistema es automático y puede equivocarse: puede ocultar algo que no es político o dejar pasar algo que sí lo es.

FeedSinPolítica es independiente y no está afiliada a ninguna plataforma.

## Pestaña Privacy practices

### Propósito único (Single purpose)
Ocultar de forma local y reversible las publicaciones de contenido político en redes sociales compatibles.

### Justificación de permisos

**storage**
Guarda en el navegador (chrome.storage.local) las preferencias del usuario (filtro activado, nivel, duración, redes habilitadas) y el contador de publicaciones ocultadas.

**alarms**
Desactiva el filtro automáticamente cuando termina la sesión temporal elegida por el usuario (30 min, 2 h u 8 h).

**Permisos de host** (x.com, twitter.com, www.youtube.com, m.youtube.com, www.reddit.com, old.reddit.com, bsky.app, www.meneame.net, meneame.net, www.threads.com, www.threads.net, mastodon.social, mastodon.online, mas.to, www.linkedin.com)
Necesarios para ejecutar el content script en las redes sociales compatibles, leer el texto visible de las publicaciones y sustituir las políticas por una tarjeta con botón "Mostrar". Solo se piden estos sitios; en cualquier otro la extensión no se ejecuta. El texto se analiza localmente y no se transmite.

### ¿Usa código remoto?
No. Todo el código y la lista de términos van dentro del paquete de la extensión.

### Datos de usuario recopilados
Marcar únicamente, si el formulario lo obliga a declarar el contenido que se lee:
- **Contenido del sitio web** (texto de las publicaciones): se procesa solo en local, no se almacena ni se transmite.

Dejar sin marcar el resto (información personal, salud, financiera, autenticación, comunicaciones personales, ubicación, historial web, actividad del usuario).

### Certificaciones obligatorias
Marcar las tres:
- No vendo ni transfiero datos de usuario a terceros fuera de los casos de uso aprobados.
- No uso ni transfiero datos de usuario para fines ajenos a la funcionalidad principal.
- No uso ni transfiero datos de usuario para determinar solvencia ni para préstamos.

### URL de la política de privacidad
URL pública de `PRIVACY.md` en GitHub, por ejemplo:
`https://github.com/victorcouce/feedsinpolitica/blob/main/PRIVACY.md`
(el repo debe ser público, o usa GitHub Pages).

## Recursos gráficos
- Icono 128×128: incluido en el paquete (`public/icon/128.png`).
- Capturas (mín. 1, hasta 5; 1280×800 o 640×400): popup abierto, feed con tarjetas de ocultación y una tarjeta con el detalle al pasar el ratón.
- Imagen promocional pequeña (440×280): recomendada. El banner está en `docs/banner.png`.

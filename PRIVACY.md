# Política de privacidad de NoPoliticsPlease

**Última actualización:** 11 de octubre de 2026

NoPoliticsPlease es una extensión de Chrome que oculta, de forma voluntaria y reversible, publicaciones de contenido político mientras navegas por redes sociales. Esta política explica qué hace la extensión con tu información.

**En resumen:** todo el análisis se hace dentro de tu navegador. La extensión no envía a ningún servidor el texto de las publicaciones ni ningún otro dato, no tiene cuentas de usuario y no incluye analítica ni publicidad.

## 1. Qué contenido analiza

Cuando activas el filtro y visitas un sitio compatible, la extensión lee el **texto visible de las publicaciones** de la página para decidir si tratan de política o elecciones. Según el sitio, esto incluye:

- el texto de la publicación y, si lo hay, el de la publicación citada;
- el título y el canal de un vídeo, y el extracto de su descripción;
- el título de las tarjetas de enlace y el texto alternativo de las imágenes escrito por el autor;
- el título y el resumen de una noticia.

Este análisis ocurre únicamente en tu navegador, en el momento de mostrarse la página. El texto se compara con una lista de términos incluida en la propia extensión. **No se analizan imágenes ni vídeos, no se identifica a personas y no se infiere tu opinión política ni la de nadie.**

La extensión no accede a mensajes privados, formularios, campos de redacción de publicaciones, contraseñas ni cookies.

## 2. Sitios en los que funciona y por qué necesita acceso

Para leer el texto de las publicaciones, la extensión necesita permiso para acceder a estos sitios, y **solo a estos**:

| Red | Direcciones |
|---|---|
| X | x.com, twitter.com |
| YouTube | www.youtube.com, m.youtube.com |
| Reddit | www.reddit.com, old.reddit.com |
| Bluesky | bsky.app |
| Menéame | www.meneame.net, meneame.net |
| Threads | www.threads.com, www.threads.net |
| Mastodon | mastodon.social, mastodon.online, mas.to |
| LinkedIn | www.linkedin.com |

En cualquier otro sitio web la extensión no se ejecuta ni puede leer nada.

## 3. Qué información se guarda

Se guardan **en tu navegador** (`chrome.storage.local`), tus preferencias y un contador:

- si el filtro está activado o desactivado;
- el nivel de filtrado elegido (Suave o Amplio);
- la duración elegida y la hora de finalización de la sesión temporal;
- qué redes tienen el filtro habilitado;
- el número total de publicaciones ocultadas, un simple número que puedes reiniciar desde el popup. No guarda qué publicaciones ni de qué red eran.

Estos datos no salen de tu equipo. Se eliminan al desinstalar la extensión.

Mientras navegas, la extensión mantiene en memoria, y solo mientras la pestaña está abierta, el número de publicaciones ocultas y una huella numérica abreviada de cada texto, que sirve para no contar dos veces la misma publicación. **No se guarda el contenido de las publicaciones** y esa información desaparece al cerrar o recargar la pestaña.

## 4. Qué información no se recopila

NoPoliticsPlease **no** recopila, almacena ni transmite:

- el contenido de las publicaciones ni su texto;
- tu historial de navegación ni las direcciones que visitas;
- los nombres de las cuentas que ves o sigues;
- datos personales, credenciales, cookies o mensajes privados;
- perfiles o preferencias políticas, reales o inferidas;
- datos de uso, analítica o identificadores publicitarios.

## 5. Conexiones externas y terceros

La extensión **no realiza ninguna conexión de red propia**. No tiene servidor, no usa servicios de inteligencia artificial en línea y no comparte datos con terceros. Las actualizaciones de la extensión y de su lista de términos se distribuyen únicamente mediante nuevas versiones publicadas en Chrome Web Store.

No vendemos ni cedemos datos, ni los usamos para fines ajenos al funcionamiento de la extensión, ni para determinar la solvencia o conceder préstamos.

## 6. Qué permisos solicita

- **storage:** guardar tus preferencias en tu navegador.
- **alarms:** desactivar el filtro automáticamente cuando termina una sesión temporal.
- **Acceso a los sitios de la tabla anterior:** leer el texto visible de las publicaciones y mostrar u ocultar su contenido.

## 7. Cómo funciona el filtrado

La extensión **no elimina nada de las plataformas**. Oculta una publicación solo visualmente, en tu pantalla, y la sustituye por una tarjeta con un botón para mostrarla. Al desactivar el filtro, todo vuelve a su estado habitual sin recargar la página. El sistema es automático y puede equivocarse: puede ocultar contenido que no es político o dejar pasar contenido que sí lo es.

## 8. Control y eliminación

- Puedes **desactivar el filtro** en cualquier momento desde el icono de la extensión.
- Puedes **desinstalar la extensión** desde `chrome://extensions`; así se eliminan todos los datos que guarda.
- Puedes **retirar el acceso a un sitio concreto** desde la configuración de la extensión en Chrome.

## 9. Menores

La extensión no está dirigida específicamente a menores y no recopila datos personales de ningún usuario.

## 10. Cambios en esta política

Si una versión futura cambia la forma de tratar la información (por ejemplo, al añadir nuevas redes o funciones), actualizaremos esta política antes de publicarla y modificaremos la fecha de arriba.

## 11. Contacto

Para cualquier pregunta sobre esta política o sobre la extensión: **victor.couce@gmail.com**

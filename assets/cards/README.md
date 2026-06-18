# Imágenes de cartas

Guarda aquí las imágenes de tus cartas para usarlas desde el juego.

## Ruta pública

Cuando ejecutes el proyecto con `npm start` o `python3 -m http.server 4173`, los archivos de esta carpeta quedan disponibles con rutas como:

```text
/assets/cards/mi-carta.png
/assets/cards/mi-carta.webp
/assets/cards/mi-carta.svg
```

## Cómo enlazar una carta con una imagen

En `src/game.js`, cada carta puede tener la propiedad `imageUrl`. Por ejemplo:

```js
makeCard(
  'aliado-ejemplo',
  'Aliado Ejemplo',
  CARD_TYPES.ALIADO,
  2,
  3,
  'Habilidad de ejemplo.',
  null,
  'Héroe',
  '/assets/cards/aliado-ejemplo.png',
)
```

También puedes usar el campo “URL de imagen opcional” en la pestaña Constructor del juego.

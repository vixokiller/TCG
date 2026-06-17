# Crónicas del Austral

Juego de cartas coleccionables para navegador, en español, inspirado en dinámicas clásicas de TCG chilenos: el mazo funciona como Castillo, los Oros pagan costes, los Aliados se enfrentan entre sí y el objetivo es vaciar el Castillo rival.

> Este proyecto es una obra original y no oficial. No copia textos, cartas ni arte de juegos comerciales; toma solo ideas generales de juego para construir una experiencia propia con mitología y folclore austral.

## Reglas implementadas

1. Cada jugador usa un Castillo estándar de 50 cartas: 15 Oros, 25 Aliados, 4 Talismanes, 4 Tótems y 2 Armas.
2. Antes de partir, cada jugador prepara 1 Oro inicial desde su Castillo y parte con 8 cartas en mano.
3. La Agrupación es automática: los Oros pagados vuelven a la Reserva de Oros al comenzar el turno.
4. La Fase Final también es automática y pasa directo a Robo después de Asignación de Daño.
5. Los Aliados se juegan en Línea de Defensa; durante Vigilia pueden moverse a Línea de Ataque solo si no entraron este turno, salvo que tengan una habilidad que lo permita.
6. En Agrupación automática, los Oros pagados vuelven a la Reserva de Oros y los Aliados en Línea de Ataque vuelven a Línea de Defensa.
7. La Batalla Mitológica se divide en Declaración de Ataque, Declaración de Bloqueadores, Guerra de Talismanes y Asignación de Daño.
8. Cada Aliado en Línea de Defensa puede bloquear a un solo Aliado atacante en la Línea de Ataque oponente.
9. En Guerra de Talismanes, el jugador defensor recibe la primera preferencia; la preferencia alterna hasta que ambos pasen.
10. Las Armas se anexan a un Aliado; cada Aliado puede tener un Arma salvo que una habilidad diga lo contrario.
11. Si un Aliado anexado es destruido, su Arma también va al Cementerio. Si el Aliado se baraja en el Castillo, el Arma se baraja junto a él. Si el Aliado sube a la mano, el Arma se destruye.
12. Los Aliados tienen raza, como Caballero, Dragón, Faerie, Héroe y Titán, y algunas habilidades benefician a Aliados de la misma raza.
13. El Cementerio recibe cartas descartadas, destruidas o enviadas por daño. El Destierro contiene cartas que normalmente no pueden recuperarse.
14. Pierde el jugador que queda sin cartas en su Castillo; el otro jugador gana.

## Disposición de mesa

- A la izquierda están las pilas: Cementerio a la izquierda del Mazo Castillo, Destierro bajo el Cementerio, Oros pagados arriba del Mazo Castillo y Reserva de Oros abajo del Mazo Castillo. El Mazo Castillo se ve como cartas boca abajo; Cementerio, Destierro, Reserva y Oros pagados muestran la última carta visible y se pueden abrir con clic.
- En el campo, la Línea de Ataque está arriba, la Línea de Defensa al medio y la Línea de Apoyo abajo.
- Las Armas anexadas se muestran parcialmente debajo del Aliado portador.
- El Mazo Castillo solo muestra cuántas cartas quedan; al hacer clic no revela su contenido.
- Al hacer clic en Cementerio, Destierro, Reserva de Oros u Oros pagados se abre un visor con sus cartas.
- Al declarar bloqueos se muestra una línea dentro del tablero que parte del Aliado bloqueador hacia el Aliado atacante bloqueado.
- La perspectiva de la mesa siempre se mantiene desde el jugador: el Rival arriba y el Jugador abajo, incluso durante el turno del rival.
- En el turno del Rival no se muestra la mano rival; solo se detiene en Declaración de Bloqueadores para que el jugador seleccione sus bloqueos.
- Al mantener el mouse sobre una carta por 2 segundos, aparece al lado izquierdo de la pantalla una ventana de información con nombre, coste, fuerza, raza y habilidad en español. Las habilidades se muestran una sola vez y los bonos de fuerza aparecen en verde; las reducciones aparecen en rojo.
- Hay una pestaña Constructor con enciclopedia de cartas, creación de cartas, URL opcional de imagen, mazos prediseñados y mazos de usuario seleccionables para jugar. Las cartas y mazos de usuario se guardan en `localStorage` del navegador.

## Cómo jugar

1. Abre `index.html` desde un servidor estático. Usa la pestaña Constructor para seleccionar un mazo prediseñado o crear uno propio.
2. En Vigilia, juega cartas desde la mano; los Aliados entran a Línea de Defensa.
3. Durante Vigilia, arrastra un Aliado desde Línea de Defensa a Línea de Ataque para declararlo atacante. Antes de Declaración de Ataque puedes arrastrarlo de vuelta a Defensa.
4. En Declaración de Bloqueadores, incluso durante el turno del rival, selecciona un Aliado en Línea de Defensa y luego un Aliado oponente en Línea de Ataque para bloquearlo.
5. Haz clic en Cementerio, Destierro, Reserva de Oros u Oros pagados para ver las cartas de esa zona.
6. Avanza a Batalla Mitológica para declarar ataques, bloqueadores, Guerra de Talismanes y daño.
7. Gana quien deje vacío el Castillo del oponente.

## Desarrollo

```bash
npm test
npm start
```

`npm start` levanta un servidor estático en el puerto 4173 usando Python, sin dependencias externas.


## Personalización persistente

- Para agregar Aliados persistentes desde la interfaz, entra a **Constructor**, completa el formulario de Crear carta, elige tipo `Aliado`, agrega raza, fuerza, coste, texto/habilidad y opcionalmente una URL de imagen. La carta se guarda en `localStorage` junto con los mazos de usuario.
- Para agregar cartas base desde código, edita `cardPool` en `src/game.js` y usa `makeCard(id, nombre, CARD_TYPES.ALIADO, coste, fuerza, texto, habilidad, raza)`.
- Para reemplazar la imagen de una carta, agrega la propiedad `imageUrl` a la carta o usa el campo “URL de imagen opcional” del Constructor. Puede ser una URL web o una ruta local servida por el proyecto, por ejemplo `/assets/mi-carta.png`.


## Imágenes de cartas

- La carpeta `assets/cards/` está reservada para guardar imágenes de cartas.
- Para enlazar una imagen desde código, agrega la ruta en el último parámetro de `makeCard`, por ejemplo `/assets/cards/oro-canelo.svg`.
- Para cartas creadas desde la interfaz, usa el campo “URL de imagen opcional” en el Constructor. Si el archivo está en esta carpeta, usa una ruta como `/assets/cards/mi-carta.png`.
- Se agregó `assets/cards/oro-canelo.svg` como ejemplo de imagen local enlazada desde `cardPool`.


## Base de datos de cartas

- La base de datos editable vive en `src/cardDatabase.js`. Cada carta se ingresa con `createCardRecord`.
- Cada registro contiene: `name`, `image`, `cost`, `strength`, `type`, `race`, `ability`, `rarity`, `code`, `edition` y `product`.
- Para que una habilidad sea funcional, usa una clave soportada en `ability`, por ejemplo `drawOnEnter`, `drawTwo`, `haste`, `recycleOnEnter`, `banishOnHit`, `raceGuardian`, `foyeDefenseBuff`, `machiExtraDraw` o `weaponBuff`.
- El juego transforma esos registros con `toPlayableCard`, de modo que puedes ingresar cartas por código en un solo lugar y usarlas en el juego y en el Constructor.

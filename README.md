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

- A la izquierda están las zonas de recursos y descarte: Oros pagados arriba, Mazo Castillo al centro, Reserva de Oros abajo, Cementerio junto al Castillo y Destierro bajo el Cementerio.
- En el campo, la Línea de Ataque está arriba, la Línea de Defensa al medio y la Línea de Apoyo abajo.
- Las Armas anexadas se muestran parcialmente debajo del Aliado portador.
- El Mazo Castillo solo muestra cuántas cartas quedan; al hacer clic no revela su contenido.
- Al hacer clic en Cementerio, Destierro, Reserva de Oros u Oros pagados se abre un visor con sus cartas.
- Al declarar bloqueos se muestra una conexión visual entre el Aliado bloqueador y el Aliado atacante bloqueado.
- Al poner el mouse sobre una carta, aparece una vista grande con nombre, coste, fuerza, raza y habilidad en español.

## Cómo jugar

1. Abre `index.html` desde un servidor estático.
2. En Vigilia, juega cartas desde la mano; los Aliados entran a Línea de Defensa.
3. Haz clic en un Aliado de tu Línea de Defensa durante Vigilia para moverlo a Línea de Ataque si puede atacar.
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

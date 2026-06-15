# Crónicas del Austral

Juego de cartas coleccionables para navegador, en español, inspirado en dinámicas clásicas de TCG chilenos: el mazo funciona como Castillo, los Oros pagan costes, los Aliados se enfrentan entre sí y el objetivo es vaciar el Castillo rival.

> Este proyecto es una obra original y no oficial. No copia textos, cartas ni arte de juegos comerciales; toma solo ideas generales de juego para construir una experiencia propia con mitología y folclore austral.

## Reglas implementadas

1. Cada jugador usa un Castillo estándar de 50 cartas: 15 Oros, 25 Aliados, 4 Talismanes, 4 Tótems y 2 Armas.
2. Antes de partir, cada jugador prepara 1 Oro inicial desde su Castillo.
3. Cada jugador parte con 8 cartas en mano.
4. El tablero muestra Mazo Castillo, Zona de Oro, Oros pagados, Cementerio, Destierro, Línea de Defensa, Línea de Ataque y Línea de Apoyo.
5. Los Tótems se juegan en la Línea de Apoyo y tienen habilidades continuas.
6. Se puede jugar hasta 1 Oro por turno.
7. Los Oros disponibles pagan Aliados, Talismanes, Tótems y Armas; al pagar pasan a Oros pagados.
8. En Agrupación, los Oros pagados vuelven a la Zona de Oro.
9. En Vigilia, se juegan cartas.
10. En Batalla Mitológica, los Aliados en Línea de Ataque atacan; los Aliados listos en Línea de Defensa pueden enfrentarlos antes de dañar el Castillo.
11. En Final se cierra el turno activo.
12. En Robo, el jugador activo roba 1 carta y luego pasa el turno.
13. Pierde el jugador que queda sin cartas en su Castillo; el otro jugador gana.

## Fases del turno

1. **Agrupación:** los Oros pagados regresan a la Zona de Oro.
2. **Vigilia:** se juegan cartas desde la mano.
3. **Batalla Mitológica:** se declaran ataques y se resuelven combates o daño al Castillo.
4. **Final:** cierre del turno activo.
5. **Robo:** se roba 1 carta y cambia el jugador activo.

## Cómo jugar

1. Abre `index.html` desde un servidor estático.
2. Avanza a Vigilia para jugar cartas.
3. Juega Aliados, Tótems, Talismanes y Armas usando Oros disponibles.
4. Avanza a Batalla Mitológica para atacar con Aliados en Línea de Ataque.
5. Gana quien deje vacío el Castillo del oponente.

## Desarrollo

```bash
npm test
npm start
```

`npm start` levanta un servidor estático en el puerto 4173 usando Python, sin dependencias externas.

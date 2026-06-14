# Crónicas del Austral

Juego de cartas coleccionables para navegador, en español, inspirado en dinámicas clásicas de TCG chilenos: el mazo funciona como Castillo, los Oros pagan costes, los Aliados se enfrentan entre sí y el objetivo es vaciar el Castillo rival.

> Este proyecto es una obra original y no oficial. No copia textos, cartas ni arte de juegos comerciales; toma solo ideas generales de juego para construir una experiencia propia con mitología y folclore austral.

## Reglas implementadas

1. Cada jugador usa un Castillo base de 50 cartas.
2. Antes de partir, cada jugador prepara 1 Oro inicial desde su Castillo.
3. Cada jugador parte con 8 cartas en mano.
4. Se puede jugar hasta 1 Oro por turno.
5. Los Oros disponibles pagan Aliados, Talismanes y Armas.
6. Al atacar, un Aliado listo del oponente defiende automáticamente si existe; el Aliado con menor fuerza es destruido y, si empatan, ambos son destruidos.
7. Si no hay defensor listo, el ataque descarta cartas del Castillo rival igual a la fuerza del Aliado atacante.
8. Al terminar turno, el siguiente jugador roba 1 carta.
9. Pierde el jugador que queda sin cartas en su Castillo; el otro jugador gana.

## Cómo jugar

1. Abre `index.html` desde un servidor estático.
2. Juega hasta 1 Oro por turno.
3. Usa Oros disponibles para pagar Aliados, Talismanes y Armas.
4. Ataca con Aliados listos para enfrentar defensores o descartar cartas del Castillo rival.
5. Gana quien deje vacío el Castillo del oponente.

## Desarrollo

```bash
npm test
npm start
```

`npm start` levanta un servidor estático en el puerto 4173 usando Python, sin dependencias externas.

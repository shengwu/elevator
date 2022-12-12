Elevator
========

My code for the game [Elevator Saga](http://play.elevatorsaga.com/).

Theory
------

Each elevator has an up mode and a down mode. If it can keep going its current direction, picking people up and dropping them off, it does. Otherwise, it finds the furthest person in its current direction who wants to go the opposite direction, picks that person up, and reverses direction.

Performance
-----------

Statistics from the [perpetual demo](http://play.elevatorsaga.com/#challenge=18) level:

- 2000 people transported
- 1350s elapsed time
- 1.48 transported/sec
- 13.7s avg waiting time
- 55.3s max waiting time
- 12585 moves


# 2022 version

Copies the compiled-to-JS version to your clipboard:

```
yarn make
```

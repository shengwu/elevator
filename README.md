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

- for levels 1-7, i only had a handler on each floor's up_button_pressed (forgot down_button_pressed) and that works better than having handlers on both
- for level 8, the first max wait time level, i thought setting the second param of goToFloor to true would help beat level 8. instead, adding a down_button_pressed handler (same function) and leaving goToFloor's second param as false worked. also worked for level 9
- level 10: another throughput level, big elevator + small elevator. commenting out the down_button_pressed handler improved throughput from 20-30 (both handlers registered) to 30-40 (only floor's up button handler registered). after a few retries, the closest i got was 46 passengers transported in 70s but the requirement is 50 passengers transported. other ideas
  - mostly ignore floor presses. have the elevator go to floors that the passengers inside the elevator request, pick people up if we're passing a floor that has requests
  - the big elevator ignores floor presses and just goes between the top and bottom floors, picking people up as it goes. the small elevator takes requests
  - ignore buttons pressed at floors. each elevator goes up, picking people up til it's full, dropping people off as it goes. then: arrive at highest floor with down button pressed. pick people up, go into "down mode"
  - our strategy right now (sending min load elevator to floor where button is pressed) seems to handle the max latency levels well but isn't consistent on the max throughput levels, even the easier ones. maybe we prioritze stopping at floors that have a ton of people waiting - because we're not penalized for max wait time

Stats from rerunning my 2022 code

- Transported: 2002
- Elapsed time: 1351s
- Transported/s: 1.48
- Avg waiting time: 14.7s
- Max waiting time: 157.9s
- Moves: 12703

Stats from rerunning my 2015 code

- Transported: 2008
- Elapsed time: 1351s
- Transported/s: 1.49
- Avg waiting time: 14.2s
- Max waiting time: 89.5s
- Moves: 12602

My newer implementation is slightly worse

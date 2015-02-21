// An effective general elevator program
// TODO: make this work better for multiple elevators
{
    init: function(elevators, floors) {
        // Global state
        var needsUp = []; // Whether someone at floor i wants to go up
        var needsDown = [];
        for (var i = 0; i < floors.length; i++) {
            needsUp.push(false);
            needsDown.push(false);
        }

        var minFloor = 0;
        var maxFloor = floors.length - 1;

        // Updates an elevator's indicators
        function updateIndicators(goingUp, elevator) {
            elevator.goingUpIndicator(goingUp);
            elevator.goingDownIndicator(!goingUp);
        }

        // If other elevators are idle, check to see if they can do anything
        function clearIdles() {
            elevators.map(function(elevator) {
                if (elevator.isIdle) {
                    elevator.handleIdle();
                }
            });
        }

        // Program all elevators
        elevators.map(function(elevator) {
            // Assuming we start at floor 0
            var goingUp = true;

            // The point at which we don't stop to pick up anyone new
            var maxLoad = (elevator.maxPassengerCount() - 1) /
                elevator.maxPassengerCount();
            var personLoad = 1 / elevator.maxPassengerCount(); // average weight

            // Change direction
            function reverseDirection() {
                goingUp = !goingUp;
                updateIndicators(goingUp, elevator);
            }

            // In the direction that the elevator is going, pick up the next
            // waiting person and return true.
            // If there is noone waiting, return false.
            function getNextPersonInCurrentDir() {
                var dirDelta = goingUp ? 1 : -1;
                var stop = goingUp ? maxFloor + 1 : minFloor - 1;
                var waiting = goingUp ? needsUp : needsDown;
                for (var i = elevator.currentFloor(); i != stop; i += dirDelta) {
                    if (waiting[i]) {
                        elevator.goToFloor(i, true);
                        return true;
                    }
                }
                return false;
            }

            // This is called when noone above us needs to go up, or noone below
            // us needs to go down.
            //
            // In this case, we go to the furthest person in the current direction
            // that wants to go the opposite direction. Then we pick them up and
            // switch direction.
            function getLastPersonInCurrentDirAndReverse() {
                // Get the floor of the furthest person from current pos
                // (start at 0 or maxFloor)
                var start = goingUp ? maxFloor : minFloor;
                var dirDelta = goingUp ? -1 : 1;
                var waiting = goingUp ? needsDown : needsUp;
                var destination = -1;
                for (var i = start; i != elevator.currentFloor(); i += dirDelta) {
                    if (waiting[i]) {
                        destination = i;
                        break;
                    }
                }
                // If we didn't find anyone, just reverse direction now
                if (destination === -1) {
                    reverseDirection();
                    getNextPersonInCurrentDir();
                } else {
                    // Go to that floor and reverse direction
                    elevator.goToFloor(destination, true);
                    reverseDirection();
                }
            }

            // One-time thing
            var gameStarted = false;

            // We put this in a property because sometimes it needs
            // to be called from clearIdles
            elevator.handleIdle = function() {
                // Start the game
                if (!gameStarted) {
                    updateIndicators(goingUp, elevator);
                    // Go to a random floor
                    elevator.goToFloor(
                            Math.floor(Math.random() * (maxFloor - minFloor + 1) + minFloor));
                    gameStarted = true;
                }
                // The elevator is idle - i.e. the destination queue is empty
                if (goingUp && elevator.currentFloor() === maxFloor) {
                    reverseDirection();
                } else if (!goingUp && elevator.currentFloor() === minFloor) {
                    reverseDirection();
                }
                // Check if anyone is waiting in the current direction
                if (!getNextPersonInCurrentDir()) {
                    getLastPersonInCurrentDirAndReverse();
                }

                // This function doesn't get called if an elevator remains idle
                // (i.e. it's empty and doesn't find anything to do right when
                //  this event is triggered)
                // Idleness happens if we get to here and destinationQueue === []
                if (elevator.destinationQueue.length === 0) {
                    elevator.isIdle = true;
                } else {
                    elevator.isIdle = false;
                }
            };

            // Event handlers
            // --------------

            elevator.on("idle", function() {
                console.log('idle was called');
                elevator.handleIdle();
                clearIdles();
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                // Update destinations based on where people want to go
                elevator.destinationQueue = elevator.getPressedFloors();
                elevator.checkDestinationQueue();
                clearIdles();
            });
            elevator.on("passing_floor", function(floorNum) {
                console.log('passing_floor was called');
                // Triggered slightly before the elevator will pass a floor
                // If we're not planning to stop here, see if we want to
                if (elevator.destinationQueue.indexOf(floorNum) === -1) {
                    if (goingUp) {
                        if (needsUp[floorNum] && elevator.loadFactor() <= maxLoad) {
                            elevator.goToFloor(floorNum, true);
                        }
                    } else {
                        if (needsDown[floorNum] && elevator.loadFactor() <= maxLoad) {
                            elevator.goToFloor(floorNum, true);
                        }
                    }
                }
                clearIdles();
            });
            elevator.on("stopped_at_floor", function(floorNum) {
                console.log('stopped_at_floor was called');
                // Clear needsUp or needsDown
                // Passengers will re-press the button if they can't get in
                if (goingUp) {
                    needsUp[floorNum] = false;
                } else {
                    needsDown[floorNum] = false;
                }
                clearIdles();
            });
        });

        // Accept requests from floors
        floors.map(function(floor) {
            floor.on("up_button_pressed", function() {
                needsUp[floor.floorNum()] = true;
                clearIdles();
            });
            floor.on("down_button_pressed", function() {
                needsDown[floor.floorNum()] = true;
                clearIdles();
            });
        });
    },

    update: function(dt, elevators, floors) {
        // This is called during the challenge
        // dt is num of game seconds elapsed since last update
    }
}

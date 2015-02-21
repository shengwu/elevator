// An effective general elevator program
{
    init: function(elevators, floors) {
        // Global state
        // TODO: this only works for one elevator
        var needsUp = []; // Whether someone at floor i wants to go up
        var needsDown = [];
        for (var i = 0; i < floors.length; i++) {
            needsUp.push(false);
            needsDown.push(false);
        }

        // Assuming we start at floor 0
        var goingUp = true;

        // Program all elevators
        elevators.map(function(elevator) {
            elevator.on("idle", function() {
                // The elevator is idle - shouldn't happen?
            });
            elevator.on("floor_button_pressed", function(floorNum) {
            });
            elevator.on("passing_floor", function(floorNum) {
            });
            elevator.on("stopped_at_floor", function(floorNum) {
            });
        });

        // Accept requests from floors
        floors.map(function(floor) {
            floor.on("up_button_pressed", function() {
                needsUp[floor.floorNum()] = true;
            });
            floor.on("down_button_pressed", function() {
                needsDown[floor.floorNum()] = true;
            });
        });
    },
    update: function(dt, elevators, floors) {
        // This is called during the challenge
        // dt is num of game seconds elapsed since last update
    }
}

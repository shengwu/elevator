// simplest program
// gets through challenges 1-7 with a few retries

const game = {
  init: function (elevators, floors) {
    elevators.map(function (elevator) {
      elevator.on("floor_button_pressed", function (floorNum) {
        elevator.goToFloor(floorNum);
      });
    });

    floors.map(function (floor) {
      floor.on("up_button_pressed", function () {
        let minLoadFactor = 100;
        let minLoadElevator = undefined;
        for (const elevator of elevators) {
          if (elevator.loadFactor() < minLoadFactor) {
            minLoadFactor = elevator.loadFactor();
            minLoadElevator = elevator;
          }
        }
        minLoadElevator.goToFloor(floor.floorNum());
      });
    });
  },
  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  },
};

// -----
// Types
// -----

type ElevatorEvent =
  | "idle"
  | "floor_button_pressed"
  | "passing_floor"
  | "stopped_at_floor";

type ElevatorEventCallback =
  | (() => void)
  | ((floorNum: number) => void)
  | ((floorNum: number, direction: "up" | "down") => void);

interface Elevator {
  goToFloor: (floor: number, directly?: boolean) => void;
  stop: () => void;
  currentFloor: () => number;
  goingUpIndicator: (set?: boolean) => void;
  goingDownIndicator: (set?: boolean) => void;
  maxPassengerCount: () => number;
  loadFactor: () => number;
  destinationDirection: () => "up" | "down" | "stopped";
  destinationQueue: number[];
  checkDestinationQueue: () => void;
  getPressedFloors: () => number[];
  on: (events: ElevatorEvent, callback: ElevatorEventCallback) => void;
}

interface Floor {
  floorNum: () => number;
  on: (
    events: "up_button_pressed" | "down_button_pressed",
    callback: () => void
  ) => void;
  buttonStates: { down: string; up: string };
}

// --------------
// Implementation
// --------------

const elevatorSaga = {
  init: function (elevators: Elevator[], floors: Floor[]) {
    const initElevatorMinWait = (elevator: Elevator) => {
      elevator.on("floor_button_pressed", (floorNum: number) => {
        elevator.goToFloor(floorNum);
      });
    };
    const onFloorButtonPressMinWait = (floor: Floor) => {
      let minLoadFactor = elevators[0].loadFactor();
      let minLoadElevator = elevators[0];
      for (const elevator of elevators) {
        if (elevator.loadFactor() < minLoadFactor) {
          minLoadFactor = elevator.loadFactor();
          minLoadElevator = elevator;
        }
      }
      minLoadElevator.goToFloor(floor.floorNum());
    };
    const initFloorMinWait = (floor: Floor) => {
      floor.on("up_button_pressed", () => onFloorButtonPressMinWait(floor));
      floor.on("down_button_pressed", () => onFloorButtonPressMinWait(floor));
    };

    const upRequestedFloors: Record<number, boolean> = {};
    const downRequestedFloors: Record<number, boolean> = {};
    const initElevatorMaxThroughput = (elevator: Elevator) => {
      // Can't rely on elevator.destinationDirection()
      let direction = "up";
      // direction = direction === "up" ? "down" : "up";
      elevator.on("idle", () => {
        console.log(
          `Elevator idle; direction: ${direction}; pressed floors: ${elevator.getPressedFloors()}`
        );
        // Reverse direction if at top or bottom
        const goingUpAndAtTop =
          direction === "up" && elevator.currentFloor() === floors.length - 1;
        const goingDownButAtBottom =
          direction === "down" && elevator.currentFloor() === 0;
        // If we're e.g. going up from floor 1 and people want an elevator on floor 0
        // Go down and get them
        const goingUpWithNothingToDo =
          direction === "up" &&
          floors
            .slice(elevator.currentFloor() + 1)
            .every(
              (floor) =>
                !upRequestedFloors[floor.floorNum()] &&
                !elevator.getPressedFloors().includes(floor.floorNum())
            );
        const goingDownWithNothingToDo =
          direction === "down" &&
          floors
            .slice(0, elevator.currentFloor())
            .every(
              (floor) =>
                !downRequestedFloors[floor.floorNum()] &&
                !elevator.getPressedFloors().includes(floor.floorNum())
            );
        if (goingUpAndAtTop || goingUpWithNothingToDo) {
          direction = "down";
        } else if (goingDownButAtBottom || goingDownWithNothingToDo) {
          direction = "up";
        }
        // Find the next floor to stop at in our current direction:
        // - person inside elevator requested stop
        // - person on that floor requested an elevator in our direction
        // Otherwise, go to the next floor
        if (direction === "up") {
          for (let i = elevator.currentFloor() + 1; i < floors.length; i++) {
            if (upRequestedFloors[i] && elevator.loadFactor() < 1) {
              elevator.goToFloor(i);
              break;
            }
            if (elevator.getPressedFloors().includes(i)) {
              elevator.goToFloor(i);
              break;
            }
          }
          // No destinations. Go to the first floor with people on it
          const firstDownRequestedFloor = floors
            .slice(elevator.currentFloor() + 1)
            .find((floor) => downRequestedFloors[floor.floorNum()]);
          if (firstDownRequestedFloor) {
            elevator.goToFloor(firstDownRequestedFloor.floorNum());
          }
          // Last resort
          if (elevator.destinationQueue.length === 0) {
            // elevator.goToFloor(elevator.currentFloor() + 1);
            elevator.goToFloor(0);
          }
        } else if (direction === "down") {
          for (let i = elevator.currentFloor() - 1; i >= 0; i--) {
            if (downRequestedFloors[i] && elevator.loadFactor() < 1) {
              elevator.goToFloor(i);
              break;
            }
            if (elevator.getPressedFloors().includes(i)) {
              elevator.goToFloor(i);
              break;
            }
          }
          // No destinations. Go to the first floor with people on it
          const firstUpRequestedFloor = floors
            .slice(elevator.currentFloor() + 1)
            .find((floor) => upRequestedFloors[floor.floorNum()]);
          if (firstUpRequestedFloor) {
            elevator.goToFloor(firstUpRequestedFloor.floorNum());
          }
          // Last resort
          if (elevator.destinationQueue.length === 0) {
            // elevator.goToFloor(elevator.currentFloor() - 1);
            elevator.goToFloor(0);
          }
        }
      });

      // If we can pick people up
      elevator.on("passing_floor", (floorNum: number) => {
        if (
          direction === "up" &&
          upRequestedFloors[floorNum] &&
          elevator.loadFactor() < 1
        ) {
          elevator.goToFloor(floorNum, true);
        } else if (
          direction === "down" &&
          downRequestedFloors[floorNum] &&
          elevator.loadFactor() < 1
        ) {
          elevator.goToFloor(floorNum, true);
        }
      });

      // Clear the map entry once we stop at a floor
      elevator.on("stopped_at_floor", (floorNum: number) => {
        if (direction === "up") {
          upRequestedFloors[floorNum] = false;
        } else if (direction === "down") {
          downRequestedFloors[floorNum] = false;
        }
      });
    };
    const initFloorMaxThroughput = (floor: Floor) => {
      floor.on(
        "up_button_pressed",
        () => (upRequestedFloors[floor.floorNum()] = true)
      );
      floor.on(
        "down_button_pressed",
        () => (downRequestedFloors[floor.floorNum()] = true)
      );
    };

    const levelNumber = parseInt(window.location.href.match(/\d+/)[0]);
    if ([8, 9].includes(levelNumber)) {
      elevators.map(initElevatorMinWait);
      floors.map(initFloorMinWait);
    } else {
      elevators.map(initElevatorMaxThroughput);
      floors.map(initFloorMaxThroughput);
    }
  },
  update: function (dt: unknown, elevators: Elevator[], floors: Floor[]) {},
};

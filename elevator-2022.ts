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
    elevators.map((elevator: Elevator) => {
      elevator.on("floor_button_pressed", (floorNum: number) => {
        elevator.goToFloor(floorNum);
      });
    });
    floors.map((floor: Floor) => {
      floor.on("up_button_pressed", () => {
        let minLoadFactor = elevators[0].loadFactor();
        let minLoadElevator = elevators[0];
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
  update: function (dt: unknown, elevators: Elevator[], floors: Floor[]) {},
};

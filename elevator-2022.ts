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

const elevatorSaga = {
  closestFloor: function (floorNums: number[], currentFloor: number) {
    let min = Infinity;
    let minIdx = -1;
    floorNums.map((num, idx) => {
      const curr = Math.abs(num - currentFloor);
      if (curr < min) {
        min = curr;
        minIdx = idx;
      }
    });
    return floorNums[minIdx];
  },

  initElevator: function (elevator: Elevator, allElevators: Elevator[]) {
    elevator.on("idle", () => {
      if (elevator.getPressedFloors().length > 0) {
        const closestFloor = this.closestFloor(
          elevator.getPressedFloors(),
          elevator.currentFloor()
        );
        elevator.goToFloor(closestFloor);
        if (closestFloor > elevator.currentFloor()) {
          elevator.goingUpIndicator();
        } else {
          elevator.goingDownIndicator();
        }
      }
    });
    elevator.on("floor_button_pressed", (floorNum: number) => {
      if (elevator.destinationDirection() == "stopped") {
        elevator.goToFloor(floorNum);
        if (floorNum > elevator.currentFloor()) {
          elevator.goingUpIndicator();
        } else {
          elevator.goingDownIndicator();
        }
      }
    });
    elevator.on(
      "passing_floor",
      (floorNum: number, direction: "up" | "down") => {
        if (
          elevator.destinationDirection() == direction &&
          elevator.getPressedFloors().includes(floorNum)
        ) {
          elevator.goToFloor(floorNum, true);
        }
      }
    );
    elevator.on("stopped_at_floor", (floorNum: number) => {});
  },

  initFloor: function (floor: Floor, allFloors: Floor[]) {
    floor.on("up_button_pressed", () => {});
    floor.on("down_button_pressed", () => {});
  },

  init: function (elevators: Elevator[], floors: Floor[]) {
    const initElevator = this.initElevator;
    const initFloor = this.initFloor;
    elevators.map((elevator) => initElevator(elevator, elevators));
    floors.map((floor) => initFloor(floor, floors));
  },

  update: function (dt: number, elevators: Elevator[], floors: Floor[]) {},
};

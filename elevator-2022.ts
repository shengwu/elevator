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
  init: function (elevators: Elevator[], floors: Floor[]) {
    const upNeeded: Record<number, boolean> = {};
    const downNeeded: Record<number, boolean> = {};

    const asArray = (rec: Record<number, boolean>): number[] => {
      const result = [];
      for (let i = 0; i < floors.length; i++) {
        if (rec[i + 1]) {
          result.push(i + 1);
        }
      }
      return result;
    };

    const getClosestFloor = (floorNums: number[], currentFloor: number) => {
      let min = Infinity;
      let minIdx = -1;
      floorNums.map((num, idx) => {
        const curr = Math.abs(num - currentFloor);
        if (curr < min) {
          min = curr;
          minIdx = idx;
        }
      });
      if (minIdx === -1) {
        return undefined;
      }
      return floorNums[minIdx];
    };

    const checkIdleElevator = (elevator: Elevator, floorNum?: number) => {
      if (elevator.getPressedFloors().length === 0) {
        requestElevator(elevator);
      }
    };

    const requestElevator = (elevator: Elevator) => {
      const closestFloorNeedingUp = getClosestFloor(
        asArray(upNeeded),
        elevator.currentFloor()
      );
      if (closestFloorNeedingUp) {
        elevator.goingUpIndicator();
        elevator.goToFloor(closestFloorNeedingUp);
      } else {
        const closestFloorNeedingDoqn = getClosestFloor(
          asArray(downNeeded),
          elevator.currentFloor()
        );
        if (closestFloorNeedingDoqn) {
          elevator.goingDownIndicator();
          elevator.goToFloor(closestFloorNeedingDoqn);
        }
      }
    };

    const checkIdleElevators = () => elevators.map(checkIdleElevator);

    const initElevator = (elevator: Elevator) => {
      elevator.goingUpIndicator(false);
      elevator.goingDownIndicator(false);

      elevator.on("idle", () => {
        checkIdleElevator(elevator);
      });
      elevator.on("floor_button_pressed", (floorNum: number) => {
        elevator.goToFloor(floorNum);
      });
      elevator.on(
        "passing_floor",
        (floorNum: number, direction: "up" | "down") => {
          if (direction === "up" && upNeeded[floorNum]) {
            elevator.goToFloor(floorNum, true);
            upNeeded[floorNum] = false;
          } else if (direction === "down" && downNeeded[floorNum]) {
            elevator.goToFloor(floorNum, true);
            downNeeded[floorNum] = false;
          }
        }
      );
      elevator.on("stopped_at_floor", (floorNum: number) => {});
    };

    const initFloor = (floor: Floor) => {
      floor.on("up_button_pressed", () => {
        upNeeded[floor.floorNum()] = true;
        checkIdleElevators();
      });
      floor.on("down_button_pressed", () => {
        downNeeded[floor.floorNum()] = true;
        checkIdleElevators();
      });
    };

    elevators.map(initElevator);
    floors.map(initFloor);
  },

  update: function (dt: number, elevators: Elevator[], floors: Floor[]) {},
};

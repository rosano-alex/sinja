import type { Node } from "./node";
import { LaneTypes } from "./lanetypes";

// deterministic scheduler phases
const statusQueue: Record<number, Node[]> = {
  [LaneTypes.SYNC]: [],
  [LaneTypes.USER]: [],
  [LaneTypes.TRANSITION]: [],
  [LaneTypes.BACKGROUND]: [],
};

let flushing = false;

function laneQueue(lane: number): Node[] {
  if (statusQueue[lane] == null) {
    statusQueue[lane] = [];
  }
  return statusQueue[lane] as Node[];
}

export function schedule(node: Node) {
  const lane = node.lane;
  laneQueue(lane).push(node);

  if (!flushing) {
    flushing = true;
    queueMicrotask(flush);
  }
}

function runQueue(queue: Node[]) {
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node) {
      node.run();
    }
  }

  queue.length = 0;
}

function hasWork(): boolean {
  return (
    laneQueue(LaneTypes.SYNC).length > 0 ||
    laneQueue(LaneTypes.USER).length > 0 ||
    laneQueue(LaneTypes.TRANSITION).length > 0 ||
    laneQueue(LaneTypes.BACKGROUND).length > 0
  );
}

function flush() {
  // Re-run phases until no new work is produced (effects may schedule more effects)
  let iterations = 0;
  do {
    runQueue(laneQueue(LaneTypes.SYNC));
    runQueue(laneQueue(LaneTypes.USER));
    runQueue(laneQueue(LaneTypes.TRANSITION));
    runQueue(laneQueue(LaneTypes.BACKGROUND));

    // Safety valve to prevent infinite loops from cyclic effects
    if (++iterations > 100) {
      break;
    }
  } while (hasWork());

  flushing = false;
}

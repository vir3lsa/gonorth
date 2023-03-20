import { DORMANT, PENDING } from "../game/events/event";
import type { Event } from "../game/events/event";

export async function processEvent(event: Event) {
  if (event.state === DORMANT && event.condition()) {
    // First look for events to commence
    await event.commence();
  } else if (event.state === PENDING) {
    // Then look for events that are counting down
    await event.tick();
  }
}

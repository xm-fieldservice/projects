const events = {};

export function subscribe(event, callback) {
  if (!events[event]) {
    events[event] = [];
  }
  events[event].push(callback);
}

export function publish(event, data) {
  if (events[event]) {
    events[event].forEach(callback => callback(data));
  }
} 
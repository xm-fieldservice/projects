/**
 * @file event_bus.js
 * @description 一个简单的发布/订阅事件总线模块
 */

const events = {};

/**
 * Publishes an event with the given name and data.
 * @param {string} eventName - The name of the event to publish.
 * @param {*} data - The data to pass to the event subscribers.
 */
export function publish(eventName, data) {
    if (events[eventName]) {
        console.log(`🚌 Event published: ${eventName}`, data);
        events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in subscriber for event ${eventName}:`, error);
            }
        });
    }
}

/**
 * Subscribes to an event with the given name.
 * @param {string} eventName - The name of the event to subscribe to.
 * @param {function} callback - The function to call when the event is published.
 * @returns {object} - An object with an `unsubscribe` method.
 */
export function subscribe(eventName, callback) {
    if (!events[eventName]) {
        events[eventName] = [];
    }
    console.log(`👂 Subscribing to event: ${eventName}`);
    events[eventName].push(callback);

    return {
        unsubscribe() {
            console.log(`👋 Unsubscribing from event: ${eventName}`);
            const index = events[eventName].indexOf(callback);
            if (index > -1) {
                events[eventName].splice(index, 1);
            }
        }
    };
}

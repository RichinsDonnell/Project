/**
 *  This is the only function called in a objects `onFrame` handler.
 *  If the objects has callbacks in it's `data._customHandlers` property,
 *  each of these is called.
 *
 *  @private
 *  @method frameManagerHandler
 *  @param {Object} ev The event object
 *  @for frameManager
 */
function frameManagerHandler(ev: any) {
        var item = this;
        if (typeof item.data === "undefined") {
            item.data = {};
        }
        if (typeof item.data._customHandlers !== "undefined" &&
            item.data._customHandlersCount > 0
        ) {
            // parcourir les handlers et les declencher
            for (var i in item.data._customHandlers) {
                if (item.data._customHandlers.hasOwnProperty(i)) {
                    if (typeof item.data._customHandlers[i] === "function") {
                        item.data._customHandlers[i].call(item, ev);
                    }
                }
            }
        }
    }
/**
 *  The `frameManager` is used to bind and unbind multiple callbacks to an object's
 *  `onFrame`. If an object has at least one handler, it's `onFrame` handler will be
 *  {{#crossLink "frameManager/frameManagerHandler:method"}}{{/crossLink}}.
 *
 *  @class frameManager
 *  @static
 */
/**
 * Add a callback to a paper.js Item's `onFrame` event.
 * The Item itself will be the `thisValue` and the event object `ev` will be the first argument
 * 
 * @param {Object} item paper.js Item
 * @param {String} name An identifier for this callback
 * @param {Function} callback
 * @param {Object} parentItem If provided, the callback will be called on parentItem.onFrame event instead of item.onFrame
 * @example
 *      animatePaper.frameManager.add(circle,"goUp",function(ev) {
 *          // Animation logic
 *      });
 * @method add
 */
export const add = (item: any, name: string, callback: Function, parentItem?: any) => {
    if (typeof item.data._customHandlers === "undefined") {
        item.data._customHandlers = {};
        item.data._customHandlersCount = 0;
    }
    item.data._customHandlers[name] = callback;
    item.data._customHandlersCount += 1;
    if (item.data._customHandlersCount > 0) {
        if (typeof parentItem !== "undefined") {
            parentItem.onFrame = frameManagerHandler;
        } else {
            item.onFrame = frameManagerHandler;
        }
    }

    return name;
};
/**
 * Remove a callback from an item's `onFrame` handler.
 * 
 * @param {Object} item paper.js Item object
 * @param {String} name The identifier of the callback you want to remove
 * @method remove
 */
export const remove = (item: any, name: string) => {
    if (typeof item.data._customHandlers !== "undefined") {
        item.data._customHandlers[name] = null;
        item.data._customHandlersCount -= 1;
        if (item.data._customHandlersCount <= 0) {
            item.data._customHandlersCount = 0;

        }
    }
};
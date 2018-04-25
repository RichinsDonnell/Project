# animatePaper.js
An animation library for [paper.js](http://paperjs.org/).

See a live demo [on jsbin](http://jsbin.com/naketikuve/edit?js,output).

## TypeScript
TypeScript declarations are available as of 1.2.1, in `dist/src/animatePaper.d.ts`.

## Changelog from 0.x to 1.x ([details](CHANGELOG.md))
 * `paper` is now a peerDependency, this should remove unnecessary code from your dependency tree.
 * The `segmentGrow` property and `grow` effect have been removed (this feature was very buggy).
 * When using `rotate` or `scale` properties, you can provide a new setting : `center` (or `rotateCenter`/`scaleCenter`) (default is `item.position`).
 * `Animation` supports a new option `repeat` (defaults to `0`).
 * `settings.complete` callback takes the `Animation`object as 1st argument.
 * Color support for `paper.Group` animation (1.1.*)
 * rgb, gray, hsl, hbs Color formats are now supported (1.1.*)
 * bug fix : negative absolute position supported (relative values must be of string type) (1.2.*)
 * bug fix : allow 0 duration (1.2.*)
 * custom easings : you can now pass a `function` `(p: number) => number` to `settings.easing` (1.2.*)

## How to use :
### npm and browserify
`npm install --save paper-animate`  
then  
`import * as animatePaper from "paper-animate";` or `var animatePaper = require("paper-animate")`


### bower
`bower install paper-animate --save`


### directly in the browser
(not recommended)  
Get the minified file in `dist/paper-animate-browser.min.js`, and include it in your page, after paper.js.


## Features :

 * Animation of multiple properties at the same time,
 * easing,
 * chaining

This is a work in progress, and any help or feedback is more than welcome.

So far, only `opacity`, `position`, `scale`, `rotate`, `translate`, `fillColor` and `strokeColor` are supported, but I add more whenever I have the time.


### Animate an Item

(you can animate a `Group` too)

You can either use a predefined animation :
```js
var myCircle = new paper.Path.Circle(new paper.Point(50,50),35);
animatePaper.fx.shake(myCircle);
```
Predefined animations available by default : `shake`, `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `splash`. You can try them [on this demo](http://jsbin.com/gitaso/4/).

Or animate properties :
```js
var myCircle = new paper.Path.Circle(new paper.Point(50,50),35);
animatePaper.animate(myCircle, {
    properties: {
        translate: new paper.Point(100,50),
        scale: 3
    },
    settings: {
        duration: 4000,
        delay: 1000,
        easing: "easeInElastic",
        complete: function(item, animation) {
            console.log('complete !');
        }
    }
});
```

When animating `position` or color properties, you can provide either relative or absolute values :
```js
var square = new paper.Path.Rectangle(new paper.Point(75, 75), new paper.Size(50,50));
square.strokeColor = 'green';
square.animate({
  properties: {
    position: {
      x: "+200", // relative to the current position of the item. At the end, `x` will be : 275
      y: 150     // absolute position. At the end, `y` will be : 150
    },
    strokeColor: {
      hue: "+100",
      brightness: "-0.4"
    }
  },
  settings: {
    duration:1500,
    easing:"easeInBounce"
  }
});
```

> Note : Relative values must be strings.

### Repeat
If you want your `Animation` to run more than once, you can use the `settings.repeat` option (defaults to `0`).  
If `settings.repeat` is a number > 0, your animation will run `settings.repeat` *additional* times.  
If you set `settings.repeat` to `true`, the animation will repeat infinitely until you call `animatePaper.stop(item, true, true)` (the third parameter should be true, otherwise only the current `Animation` will be stopped).  
If you set `settings.repeat` to a function, it will be called at the end of every "loop" and the `Animation` will repeat itself as long as `settings.repeat` returns `true`.  
This feature works best with relative values (e.g. `'+myVal'` instead of `myVal`), if you repeat an animation with absolute values you won't get the desired result.

```js
animatePaper.animate(item,{
    properties: {
      rotate: '+360'
    },
    settings: {
      center: new paper.Point(100, 50),
      duration: 2000,
      repeat: 2, // animation will run 3 times total
      easing: "linear"
    }
});
animatePaper.animate(item2,{
    properties: {
      rotate: '+360'
    },
    settings: {
      center: new paper.Point(100, 50),
      duration: 2000,
      repeat: true, // will loop until .stop() is called
      easing: "linear"
    }
});
setTimeout(function() {
  animatePaper.stop(item2, false, true);
}, 10000);

var c = 0;
animatePaper.animate(item3,{
    properties: {
      rotate: '+360'
    },
    settings: {
      center: new paper.Point(100, 50),
      duration: 2000,
      repeat: function(item, animation) { // will run until c >= 2
         c++;
         return (c < 2);
      },
      easing: "linear"
    }
});
```


The lib also extends `Item.prototype` with `.animate()` and `.stop()` methods, which means you can also use
```js
myCircle.animate({
    /*
        Animation parameters ...
    */
});
```

If you want to perform multiple animations successively, you can provide an array of parameters objects :
```js
var star = new paper.Path.Star(new paper.Point(45,50),5,25,45);
star.fillColor = "black";
star.opacity = 0;
star.animate([{
  properties: {
      translate: new paper.Point(200,50),
      rotate: -200,
      scale: 2,
      opacity:1
  },
  settings: {
      duration:3000,
      easing:"swing"
  }
},
{
  properties: {
      translate: new paper.Point(0,50),
      rotate: 200,
      scale: 1,
      opacity:0
  },
  settings: {
      duration:3000,
      easing:"swing"
  }
}]);
```
This is especially helpful when adding predefined animations to the library, it helps avoiding callback hell.


You can stop all running animations on an item by calling :
```js
animatePaper.stop(star);
// or
star.stop();
```

The `stop` method can take a `goToEnd` argument.
If true, all the animations will take their final value and `complete` callbacks will be called.


### Easing

By default, the supported easing functions are : linear, swing, easeInSine, easeOutSine, easeInOutSine, easeInCirc, easeOutCirc, easeInOutCirc, easeInElastic, easeOutElastic, easeInOutElastic, easeInBack, easeOutBack, easeInOutBack, easeInBounce, easeOutBounce, easeInOutBounce, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo.

If you want to use more easing functions, `settings.easing` can take a `(p: number) => number` function as a value, so that you can use your own or use some from an external library such as [bezier-easing](https://github.com/gre/bezier-easing).
```js
animatePaper.animate(item,{
    properties: {
      /** ... **/
    },
    settings: {
      /** ... **/
      easing: BezierEasing(0, 0, 1, 0.5)
    }
});
```

Alternatively, you can use the `animatePaper.extendEasing(myEasingFunctions)` method to add your own easing functions or override any existing easing.

The method takes only one argument : an object in which keys are easing names, and values are easing functions:

```js
animatePaper.extendEasing({
    "triple": function(p) {
        return p*3;
    }
});
```

Learn more about easing [here](http://easings.net/).

### Extend property hooks

If you want to add support for a new property or override the library's behavior for properties that are already supported,
you can use `animatePaper.extendPropHooks(myPropHooks);`.

`myPropHooks` should be an object in which keys are property names, and values are "hook objects".

Each "hook object" can have a `get`, `set` and `ease` method, and will be used to interface the animation with the property.

For example, say you want to add support for color animation:
```js
animatePaper.extendPropHooks({
  "fillColor": {
    get: function(tween) {
      // my code ...
    },
    ease: function(tween,easedPercent) {
      // my code ...
    }
  }
});
```
When these functions are used, they are passed only one argument : the Tween object (see the doc in doc/ for more details),
exept for the `ease()` function which gets the eased percent as second parameter.

 * The `get()` function must return the current value of the `Tween.item`'s property.
 * The `set()` function must set the value of the `Tween.item`'s property with `Tween.now` (which will most likely be the result of `get()` or `ease()`)
 * The `ease()` function must return the eased value. The second parameter is the eased percent.


### Add your own animations to the lib

To do so, simply add properties to `animatePaper.fx`, like so :
```js
animatePaper.fx.wave = function(item,settings) {
  var myAnimations = [...];
  item.animate(myAnimations);
};
animatePaper.fx.wave(myItem);
```

## Contributing
as of 1.2.1 the lib uses TypeScript, so make your changes in src/*.ts then build with `gulp build-paper-animate` and `gulp build-paper-animate-browser`
 

## TODOS
 * Change how `item.data._animatePaperVals` works to allow multiple animations of the same property at the same time.
 * Change `Tween` so that we garantee values are right at `0`and `1` positions, to avoid problems with imprecise numbers (floating point). See "Negative position" in tests.js.
 * Add tests

## Help needed !

I'm a beginner in paper.js, so if you spot a mistake or want to add something to the lib,
any help would be appreciated :-)


## Author
camille dot hodoul at gmail dot com

## Contributors
 * User [pueding](https://github.com/pueding) for bug fixes and delay feature.
 * Users [s-light](https://github.com/s-light) and [StratusBase](https://github.com/StratusBase) for feedback, ideas and contributions (Group Color support, bug fixes).

@Eartz_HC

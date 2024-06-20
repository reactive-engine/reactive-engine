# Reactive Engine 
Licensed under the MIT license

#  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/reactive-engine/reactive-engine) [![npm version](https://img.shields.io/npm/v/reactive-engine.svg?style=flat)](https://www.npmjs.com/package/reactive-engine)

## Overview 

Reactive-Engine is a library designed to track changes made to an object and its nested properties using ES6 Proxies. It aims to be highly performant and  practical.



The Reactive-Engine library was developed specifically for Movijs but designed to be extendable beyond that. In short, you can extend the Reactive-Engine library for your own frameworks.

Reactive-Engine generally tracks changes in object, list, map, weakmap, set and weakset types, lists callbacks invoked by these objects, and invokes these callbacks when changes occur. It's designed to be easy to use and extend.

It's ready for use without any additional configuration. You can start using it in its simplest form as shown below. You can refer to the documentation to extend it according to your needs.
 
## Install  
```
$ npm install reactive-engine --save
```

### Create an reactive 

Below is how you can create and start using a Reactive object in its simplest form:
```javascript
import {Reactive} from "reactive-engine"; 
 
// Example using the Reactive library

// Create an instance of Reactive
const reactive = new Reactive();

// Create a target object to observe
const targetObject = {
  name: 'John',
  age: 30
};

// Create the observed data
const observedData = reactive.observe(targetObject);

// Use the effect function to observe the watched data
const callDispose = reactive.watch(() => {
  console.log(observedData.name);
});

const callDispose2 = reactive.watch(observedData,'name',(value) => {
  console.log(value);
});
// Test: Change the 'name' property
observedData.name = 'Jane'; // This will log 'Jane' to the console

// Dispose the effect
callDispose();
callDispose2();
//or
reactive.dispose();
```

In this example:

1. `reactive` is an instance of the Reactive library.
2. `targetObject` is an object whose changes we want to observe.
3. observedData is created using `reactive.observe(targetObject)`, making observedData a watched version of targetObject.
4. `reactive.watch()` sets up a function to observe changes to observedData.name. When observedData.name changes, the function inside reactive.effect() is triggered, logging the new value of observedData.name to the console.
5. `callDispose()` is used to dispose of (or unsubscribe from) the effect function. After calling callDispose(), further changes to observedData.name will no longer trigger the effect function.
This demonstrates how to use Reactive to monitor changes to an object and unsubscribe from observing those changes when no longer needed.


Don't forget to remove unused objects or the Reactive object when you no longer need them. Otherwise, you might encounter memory leaks.


### For everything else, you can review the documentation.
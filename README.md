# React Performance 🚀

With the release of React Fiber in v16, `react-addons-perf` has officially become obsolete. This project aims to be a "close enough" alternate solution for React and React Native.

## Usage

### Screenshots

#### Logs

![Renders](docs/renders.png)

#### Reports

![Report](docs/report.png)

#### Timing

![Timing](docs/timing.png)

## Installation

* [Yarn](https://yarnpkg.com): `yarn add @drivetribe/react-performance`
* [npm](https://www.npmjs.com): `npm install @drivetribe/react-performance`

## In code

```js
import ReactPerformance from '@drivetribe/react-performance';
```

You can also choose to import selectively:

```js
import {
  measure,
  startRecording,
  printRecording
} from '@drivetribe/react-performance';
```

NOTE: In a production environment, `ReactPerformance` disables itself. When using React Native, it will only work once the Remote JS Debug has been activated.

### Measure

To measure the rendering of a component, wrap it with the `measure` HOC:

```js
class MyComponent extends React.Component {
  /* ... */
}

export default ReactPerformance.measure({
  getId: 'some_recognizable_identifier',
  Component: MyComponent,
  isCollapsed: false,
  isMuted: false
});
```

That's it.

If you use Redux, read the section below on how to [Use with Redux](#use-with-redux).

#### Options

* `getId` is a string or function that helps you uniquely identify each component being rendered in the logs.
  * As a string, if it is a key of the component's `props`, the key and value are both used. Otherwise it is used as a static value.
  * As a function, it receives `props` and returns a string.
* `isCollapsed` is `true` by default.
  * This collapses the duration & diff logs when a component renders.
* `isMuted` is `false` by default.
  * This mute the single component measure log (to be used with `startRecording` & `printRecording`)

### Record

To generate reports, start recording data by running:

```js
ReactPerformance.startRecording();
```

And then print out the report by running:

```js
ReactPerformance.printRecording();
```

This prints out a report on all the components being measured.

### Use with Redux

#### `connect`

Only "smart" components should be measured since those are typically the components that respond to state changes (and usually the only components that significantly impact performance).

With the assumption that any data passed down to components is encapsulated in a top-level state, the most appropriate way to use this with Redux is to use `ReactPerformance.connect`:

```js
class MyComponent extends React.Component {
  /* ... */
}

export default ReactPerformance.connect({
  mapStateToProps,
  mapDispatchToProps,
  getId: 'some_recognizable_identifier',
  Component: MyComponent
});
```

This is equivalent to `ReactPerformance.measure` - except it also connects the component to the Redux store.

#### `createStore`

To get measurements on the full duration across all component renders triggered by dispatching actions, a middleware is provided to create the store:

```js
const enhancer = redux.compose(
  // ...All other middleware first
  // This must be the last one!
  ReactPerformance.createNotifier()
);
const store = redux.createStore(rootReducer, enhancer);
```

This will log measurements in batches of re-renders caused by updates to the store:

![Notifying](docs/notifying.png)

---

## Contributing & Testing

PRs to improve this library are always welcome, but please make sure to test your changes locally before submitting, and to be consistent with the coding style.

To test your changes you have to do the following:

1. run `yarn develop` in the root directory, to start a watch process that compiles `lib` to `dist`
1. `cd` into the `examples` folder and run `yarn && yarn start` to start the `react-create-app` server

Now you can test your changes at `http://localhost:3000/`

---

© 2018 [Kelset](http://twitter.com/kelset) for [DriveTribe](https://twitter.com/DriveTribeTech).

---

Licensed under [MIT](http://amsul.ca/MIT), started as a fork of [Amsul's](https://github.com/amsul/react-performance) lib.

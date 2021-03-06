// @flow

import * as React from 'react';
import * as utils from '../utils';

let isRecording = false;
let record = {};

type MeasureType = ({
  getId: string | ((props: Object) => string),
  Component: React.ComponentType<*>,
  isCollapsed?: boolean,
  isMuted?: boolean
}) => React.ComponentType<*>;

const measure: MeasureType = ({
  getId,
  Component,
  isCollapsed = true,
  isMuted = false
}) => {
  const isDebuggingEnabled = typeof atob !== 'undefined';

  if (!process || !process.env || process.env.NODE_ENV !== 'development') {
    // $FlowFixMe
    if (typeof GLOBAL.document != 'undefined') {
      return Component;
    } else if (
      typeof GLOBAL.navigator != 'undefined' &&
      GLOBAL.navigator.product == 'ReactNative'
    ) {
      if (!isDebuggingEnabled) {
        return Component;
      }
    }
  }

  class Measured extends React.Component<*> {
    componentWillMount() {
      this.identifier = utils.getIdentifier({ element: this, getId });
      this.recordIdentifier = createRecordItem({
        element: this,
        componentName
      });
      this._startTimer();
    }

    componentDidMount() {
      if (!isMuted) {
        this._groupStart(true, 'Mounted %o', componentName);
        this._endTimer();
        this._groupEnd();
      }
    }

    componentWillUpdate() {
      this._startTimer();
    }

    componentDidUpdate(prevProps, prevState) {
      const changeDetails = utils.getChangeDetails({
        object: this.props,
        prevObject: prevProps
      });
      const hasChanges = !!changeDetails.length;
      if (!isMuted) {
        this._groupStart(hasChanges, 'Rendered %o', componentName);
        this._endTimer();
        this._logChanges(changeDetails);
        this._groupEnd();
      } else {
        this.renderEndedAt = Date.now();
      }
      recordUpdate({ hasChanges, element: this });
    }

    render() {
      return <Component {...this.props} />;
    }

    identifier = '<<unidentified>>';
    recordIdentifier = '<<unidentified>>';
    renderStartedAt = 0;
    renderEndedAt = 0;

    _getTimerText() {
      return [`Identifier: ${this.identifier}`, 'Render time'].join('\n');
    }

    _startTimer() {
      this.renderStartedAt = Date.now();
      const timerText = this._getTimerText();
      console.time(timerText);
      if (this.props._isProfilingPerf) {
        console.profile(timerText);
      }
    }

    _endTimer() {
      this.renderEndedAt = Date.now();
      console.timeEnd(this._getTimerText());
      if (this.props._isProfilingPerf) {
        console.profileEnd();
      }
    }

    _groupStart(hasChanges, ...args) {
      if (isCollapsed) {
        console.groupCollapsed(...args);
        return;
      }
      console.group(...args);
    }

    _groupEnd() {
      console.groupEnd();
    }

    _logChanges(changeDetails) {
      if (!changeDetails.length) {
        console.log(
          '🚨 %cWasted render %c(no changed props)',
          'color: red',
          'color: gray'
        );
        return;
      }
      changeDetails.forEach(changeDetail => {
        console.log(
          'Changed prop %o: %o → %o',
          changeDetail.key,
          changeDetail.prevValue,
          changeDetail.value
        );
      });
    }
  }

  const componentName = Component.displayName || Component.name;
  Measured.displayName = `Measured(${componentName})`;
  return Measured;
};

export default measure;

////////////
// RECORD //
////////////

const INITIAL_ITEM_KEYS = {
  'Wasted time (ms)': 0,
  'Wasted re-renders': 0,
  'Re-renders': 0
};

const createRecordItem = ({ element, componentName }) => {
  // $FlowFixMe
  const owner = element._reactInternalFiber._debugOwner;
  const ownerName =
    owner !== null && typeof owner !== 'undefined'
      ? // $FlowFixMe
        element._reactInternalFiber._debugOwner.type.name
      : '';
  const recordIdentifier = `${componentName}: ${element.identifier}`;
  record[recordIdentifier] = {
    'Owner > component': `${ownerName} > ${componentName}`,
    ...INITIAL_ITEM_KEYS
  };
  return recordIdentifier;
};

const recordReset = () => {
  Object.keys(record).forEach(key => {
    record[key] = {
      ...record[key],
      ...INITIAL_ITEM_KEYS
    };
  });
};

const recordUpdate = ({ hasChanges, element }) => {
  if (!isRecording) {
    return;
  }
  record[element.recordIdentifier]['Re-renders'] += 1;
  if (!hasChanges) {
    record[element.recordIdentifier]['Wasted re-renders'] += 1;
    record[element.recordIdentifier]['Wasted time (ms)'] +=
      element.renderEndedAt - element.renderStartedAt;
  }
};

export const startRecording = () => {
  isRecording = true;
  recordReset();
};

export const printRecording = () => {
  isRecording = false;
  console.table(record);
  recordReset();
};

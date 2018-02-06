// @flow

import * as React from 'react';
import * as utils from '../utils';

import { createRecordItem, recordUpdate } from './record';

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
  if (!process || !process.env || process.env.NODE_ENV !== 'development') {
    return Component;
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

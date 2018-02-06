const INITIAL_ITEM_KEYS = {
  'Wasted time (ms)': 0,
  'Wasted renders': 0,
  Renders: 0
};

let isRecording = false;
let record = {};

export const createRecordItem = ({ element, componentName }) => {
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

export const recordUpdate = ({ hasChanges, element }) => {
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

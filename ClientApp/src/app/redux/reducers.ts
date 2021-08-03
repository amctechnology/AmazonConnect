/* eslint-disable @typescript-eslint/no-use-before-define */
import { combineReducers } from 'redux';
import {
  IScenario,
  IInteraction,
  Property,
  IMetadata,
  IOperation
} from '@amc-technology/ui-library';
import { IAction, ACTION_TYPE, DIRECTION } from './action';

export const rootReducer = combineReducers({ scenarios });
function scenarios(state: IScenario[] = [], action: IAction) {
  try {
    switch (action.type) {
      case ACTION_TYPE.started:
        return state;
      case ACTION_TYPE.ringing:
        return newScenario(state, action);
      case ACTION_TYPE.answered:
        return connectedScenario(state, action);
      case ACTION_TYPE.completed:
        return removedScenario(state, action);
      case ACTION_TYPE.completedTransfer:
        return removedTransferScenario(state, action);
      case ACTION_TYPE.completedConference:
        return conferenceScenario(state, action);
      case ACTION_TYPE.hold:
        return heldScenario(state, action);
      case ACTION_TYPE.resume:
        return connectedScenario(state, action);
      case ACTION_TYPE.conference:
        return transferScenario(state, action);
      case ACTION_TYPE.warmtransfer:
        return transferScenario(state, action);
      case ACTION_TYPE.conferencePartyLeft:
        return conferencePartyLeft(state, action);
      default:
        return state;
    }
  } catch (e) {
    console.error(e);
    return state;
  }
}

function conferencePartyLeft(state: IScenario[], action: IAction) {
  const oldScenario = state.find(
    (aScenario) =>
      aScenario.interactions.length > 0 &&
      aScenario.interactions[0].interactionId === action.uuid
  );

  // check if interaction still exists
  if (oldScenario == null) {
    return state;
  }

  const partiesList = [];
  for (let index = 0; index < action.connections.length; index++) {
    partiesList.push({
      header: {
        image: new URL(action.iconPack + 'Phone_Number_Icon.png'),
        tooltip: 'Phone',
        value: action.connections[index].phoneNumber
      },
      startTime: new Date().getTime(),
      operations: [
        action.operations.disabledEndCall(
          action.uuid,
          action.connections ? action.connections[index].connectionId : ''
        )
      ],
      properties: []
    });
  }

  let interaction: IInteraction;
  if (partiesList.length > 1) {
    interaction = {
      subheaderData: {
        value: '',
        tooltip: 'Telephony',
        image: new URL(action.iconPack + 'Phone_Number_Icon.png')
      },
      parties: partiesList,
      interactionId: action.uuid,
      properties: [],
      startTime: new Date().getTime(),
      displayCallTimer: true,
      operations: [action.operations.hangupOperationBuilder(action.uuid)],
      UIHeadersData: {
        minimizeUrl: new URL(action.iconPack + 'section_collapse.png'),
        maximizeUrl: new URL(action.iconPack + 'section_expand.png'),
        statusUrl: new URL(action.iconPack + 'Status_Ringing.png'),
        statusText: 'On Call',
        directionText: 'Conference',
        displayHoldCounter: false
      }
    };
  } else {
    const isHeld =
      action.connections.find((connection) => connection.status === 'hold') !=
      null;

    if (isHeld) {
      interaction = oldScenario.interactions[0];
    } else {
      interaction = {
        subheaderData: {
          value: formatPhoneNumber(action.number),
          tooltip: 'Telephony',
          image: new URL(action.iconPack + 'Phone_Number_Icon.png')
        },
        interactionId: action.uuid,
        properties: [],
        startTime: new Date().getTime(),
        displayCallTimer: true,
        operations: [
          action.operations.hangupOperationBuilder(
            action.uuid,
            action.connections ? action.connections[0].connectionId : ''
          ),
          action.operations.holdOperationBuilder(action.uuid),
          action.operations.blindTransferBuilder(),
          action.operations.warmTransferBuilder(),
          action.operations.conferenceBuilder()
        ],
        UIHeadersData: {
          minimizeUrl: new URL(action.iconPack + 'section_collapse.png'),
          maximizeUrl: new URL(action.iconPack + 'section_expand.png'),
          statusUrl: new URL(action.iconPack + 'Status_OnCall.png'),
          statusText: 'On Call',
          directionText: action.direction,
          displayHoldCounter: false
        }
      };
    }
  }

  const scenario: IScenario = {
    interactions: [interaction]
  };
  state = [];
  state.push(scenario);
  return [...state];
}

function newScenario(state: IScenario[], action) {
  let operations: IOperation[] = [];
  if (action.direction === DIRECTION.outbound) {
    operations = [action.operations.hangupOperationBuilder(action.uuid)];
  } else {
    operations = [action.operations.answerOperationBuilder(action.uuid)];
  }

  const interaction: IInteraction = {
    subheaderData: {
      value: formatPhoneNumber(action.number),
      tooltip: 'Telephony',
      image: new URL(action.iconPack + 'Phone_Number_Icon.png')
    },
    interactionId: action.uuid,
    properties: [],
    startTime: new Date().getTime(),
    displayCallTimer: true,
    operations: operations,
    UIHeadersData: {
      minimizeUrl: new URL(action.iconPack + 'section_collapse.png'),
      maximizeUrl: new URL(action.iconPack + 'section_expand.png'),
      statusUrl: new URL(action.iconPack + 'Status_Ringing.png'),
      statusText: 'Ringing',
      directionText: action.direction,
      displayHoldCounter: false
    }
  };
  const scenario: IScenario = {
    interactions: [interaction]
  };

  return [...state, scenario];
}

function conferenceScenario(state: IScenario[], action: IAction) {
  const partiesList = [];

  for (let index = 0; index < action.connections.length; index++) {
    partiesList.push({
      header: {
        image: new URL(action.iconPack + 'Phone_Number_Icon.png'),
        tooltip: 'Phone',
        value: action.connections[index].phoneNumber
      },
      startTime: new Date().getTime(),
      operations: [
        action.operations.disabledEndCall(
          action.uuid,
          action.connections ? action.connections[index].connectionId : ''
        )
      ],
      properties: []
    });
  }
  const interaction: IInteraction = {
    subheaderData: {
      value: '',
      tooltip: 'Telephony',
      image: new URL(action.iconPack + 'Phone_Number_Icon.png')
    },
    parties: partiesList,
    interactionId: action.uuid,
    properties: [],
    startTime: new Date().getTime(),
    displayCallTimer: true,
    operations: [action.operations.hangupOperationBuilder(action.uuid)],
    UIHeadersData: {
      minimizeUrl: new URL(action.iconPack + 'section_collapse.png'),
      maximizeUrl: new URL(action.iconPack + 'section_expand.png'),
      statusUrl: new URL(action.iconPack + 'Status_Ringing.png'),
      statusText: 'On Call',
      directionText: 'Conference',
      displayHoldCounter: false
    }
  };

  const scenario: IScenario = {
    interactions: [interaction]
  };
  state = [];
  state.push(scenario);
  return [...state];
}

function transferScenario(state: IScenario[], action: IAction) {
  const oldScenario = state.find(
    (aScenario) =>
      aScenario.interactions.length > 0 &&
      aScenario.interactions[0].interactionId === action.uuid
  );

  // consult call UI already exists
  if (oldScenario != null) {
    return state;
  }

  let operations: IOperation[] = [];
  operations = [
    action.operations.processTransfer(
      action.uuid,
      action.type === ACTION_TYPE.conference
        ? 'Conference Consult'
        : 'Warm Transfer'
    )
  ];

  const interaction: IInteraction = {
    subheaderData: {
      value: formatPhoneNumber(action.number),
      tooltip: 'Telephony',
      image: new URL(action.iconPack + 'Phone_Number_Icon.png')
    },
    interactionId: action.uuid,
    properties: [],
    startTime: new Date().getTime(),
    displayCallTimer: true,
    operations: operations,
    UIHeadersData: {
      minimizeUrl: new URL(action.iconPack + 'section_collapse.png'),
      maximizeUrl: new URL(action.iconPack + 'section_expand.png'),
      statusUrl: new URL(action.iconPack + 'Status_OnCall.png'),
      statusText: 'On Call',
      directionText:
        action.type === ACTION_TYPE.conference
          ? 'Conference Consult'
          : 'Warm Transfer',
      displayHoldCounter: false
    }
  };
  const scenario: IScenario = {
    interactions: [interaction]
  };
  return [...state, scenario];
}

function connectedScenario(state: IScenario[], action: IAction) {
  const interaction = state.find(
    (scenario) =>
      scenario.interactions.length > 0 &&
      scenario.interactions[0].interactionId === action.uuid
  ).interactions[0];

  interaction.UIHeadersData.statusText = 'On Call';

  interaction.UIHeadersData.statusUrl = new URL(
    action.iconPack + 'Status_OnCall.png'
  );
  interaction.operations = [
    action.operations.hangupOperationBuilder(
      action.uuid,
      action.connections ? action.connections[0].connectionId : ''
    ),
    action.operations.holdOperationBuilder(action.uuid),
    action.operations.blindTransferBuilder(),
    action.operations.warmTransferBuilder(),
    action.operations.conferenceBuilder()
  ];
  interaction.UIHeadersData.displayHoldCounter = false;

  if (
    interaction.UIHeadersData.holdCounterData &&
    interaction.UIHeadersData.holdCounterData.currentHoldStartTime
  ) {
    const pastCallDurations =
      interaction.UIHeadersData.holdCounterData.pastCallDurations || [];
    pastCallDurations.push({
      startTime: interaction.UIHeadersData.holdCounterData.currentHoldStartTime,
      endTime: new Date().valueOf()
    });
    interaction.UIHeadersData.holdCounterData.pastCallDurations =
      pastCallDurations;
    interaction.UIHeadersData.holdCounterData.currentHoldStartTime = null;
  }

  return [...state];
}

function heldScenario(state: IScenario[], action) {
  const interaction = state.find(
    (scenario) =>
      scenario.interactions.length > 0 &&
      scenario.interactions[0].interactionId === action.uuid
  ).interactions[0];

  interaction.UIHeadersData.statusText = 'On Hold';
  interaction.UIHeadersData.statusUrl = new URL(
    action.iconPack + 'Status_OnHold.png'
  );
  interaction.operations = [
    action.operations.resumeOperationBuilder(action.uuid),
    action.operations.blindTransferBuilder(),
    action.operations.warmTransferBuilder(),
    action.operations.conferenceBuilder()
  ];
  interaction.UIHeadersData.displayHoldCounter = true;

  if (!interaction.UIHeadersData.holdCounterData) {
    const startTime = new Date().valueOf();
    interaction.UIHeadersData.holdCounterData = {
      pastCallDurations:
        (interaction.UIHeadersData.holdCounterData &&
          interaction.UIHeadersData.holdCounterData.pastCallDurations) ||
        [],
      currentHoldStartTime: startTime
    };
  } else {
    interaction.UIHeadersData.holdCounterData.currentHoldStartTime =
      new Date().getTime();
  }

  return [...state];
}

function removedScenario(state: IScenario[], action: IAction) {
  const filterStates = state.filter(
    (scenario) =>
      scenario.interactions.length > 0 &&
      scenario.interactions[0].interactionId !== action.uuid
  );
  return [...filterStates];
}

function removedTransferScenario(state: IScenario[], action: IAction) {
  return [];
}

function formatPhoneNumber(number: string) {
  if (typeof number === 'string') {
    return number
      .replace(/[^0-9]/g, '')
      .replace(/([0-9]+)([0-9]{3})([0-9]{3})([0-9]{4})/, '+$1 ($2) $3-$4');
  }
  return '1234567890';
}

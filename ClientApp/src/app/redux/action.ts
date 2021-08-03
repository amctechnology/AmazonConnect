import { ConnectInteractionOperationsService } from '../connect-interaction-operations.service';
export interface IAction {
  type: string; // started, ringing, answered, completed
  number?: string;
  direction?: DIRECTION;
  uuid: string;
  operations?: ConnectInteractionOperationsService;
  iconPack?: string;
  connections?: any;
}

export enum DIRECTION {
  inbound = 'Inbound',
  outbound = 'Outbound'
}

export enum ACTION_TYPE {
  started = 'started',
  ringing = 'ringing',
  answered = 'answered',
  completed = 'completed',
  hold = 'hold',
  resume = 'resume',
  noop = 'noop',
  conference = 'conference',
  warmtransfer = 'warmtransfer',
  blindtransfer = 'blindtransfer',
  completedTransfer = 'completedTransfer',
  completedConference = 'completedConference',
  conferencePartyLeft = 'conferencePartyLeft'
}

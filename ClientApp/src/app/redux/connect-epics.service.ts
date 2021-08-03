import { Injectable } from '@angular/core';
import { ChannelApiService } from '../channel-api.service';
import { combineEpics, ActionsObservable } from 'redux-observable';
import { mergeMap, catchError } from 'rxjs/operators';
import { of, merge } from 'rxjs';
import { IAction, ACTION_TYPE, DIRECTION } from './action';
import {
  INTERACTION_DIRECTION_TYPES,
  RecordItem,
  IInteraction,
  INTERACTION_STATES,
  CHANNEL_TYPES
} from '@amc-technology/davinci-api';
import { LoggerService } from '../logger.service';
import { ofType } from 'redux-observable';

@Injectable({
  providedIn: 'root'
})
export class ConnectEpicsService {
  rootEpic;

  constructor(
    private channelApi: ChannelApiService,
    private loggerService: LoggerService
  ) {
    this.rootEpic = combineEpics(
      this.ringing,
      this.answered,
      this.completed,
      this.hold,
      this.resume,
      this.conference
    );
  }

  conference = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.conference),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Conference:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);
          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.Alerting,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Conferencing:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );

  ringing = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.ringing),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Ringing:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);
          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.Alerting,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Ringing:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );

  answered = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.answered),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Answered:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);

          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.Connected,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Answered:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );

  completed = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.completed),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Completed:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);

          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.Disconnected,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Completed:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );

  hold = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.hold),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Hold:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);

          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.OnHold,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Hold:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );

  resume = (action$: ActionsObservable<IAction>) =>
    action$.pipe(
      ofType(ACTION_TYPE.resume),
      mergeMap((action) => {
        try {
          this.loggerService.logger.logDebug(
            `Epics Resume:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}`
          );
          const direction =
            action.direction === DIRECTION.inbound
              ? INTERACTION_DIRECTION_TYPES.Inbound
              : INTERACTION_DIRECTION_TYPES.Outbound;
          const recordItem = new RecordItem('', '', '');
          recordItem.setPhone('', '', action.number);

          const interaction: IInteraction = {
            interactionId: action.uuid,
            scenarioId: action.uuid,
            state: INTERACTION_STATES.Connected,
            channelType: CHANNEL_TYPES.Telephony,
            direction: direction,
            details: recordItem
          };
          this.channelApi.setInteraction(interaction);
        } catch (e) {
          this.loggerService.logger.logError(
            `Epics Resume:
          uuid=${action.uuid}
          type=${action.type}
          number=${action.number}
          direction=${action.direction}
          error=${JSON.stringify(e)}`
          );
        }
        return of({
          type: ACTION_TYPE.noop,
          uuid: action.uuid
        });
      })
    );
}

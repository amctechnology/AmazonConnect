import { Injectable } from '@angular/core';
import * as DaVinciApi from '@amc-technology/davinci-api';
import { ConnectService } from './connect.service';
import { LoggerService } from './logger.service';
import {
  IInteraction,
  IAppConfiguration,
  setSupportedChannels,
  CHANNEL_TYPES,
  CONTEXTUAL_OPERATION_TYPE
} from '@amc-technology/davinci-api';
import { getContactId } from './util/getContactId';

@Injectable({
  providedIn: 'root'
})
export class ChannelApiService {
  public channelToDaVinci = {};
  public DaVinciToChannel = {};
  public connectCcpUrl;
  private lastConnectPresence = '';
  private lastDaVinciPresence = '';
  private appName = '';
  constructor(
    private _connectService: ConnectService,
    private loggerService: LoggerService
  ) {}

  async initialize() {
    await DaVinciApi.registerContextualControls(
      this.ContextualControlCallback.bind(this)
    );
    await DaVinciApi.registerOnPresenceChanged(this.onDaVinciPresenceChanged);
    await DaVinciApi.registerClickToDial(this.onClickToToDial);
    await DaVinciApi.registerOnLogout(this.logout);
    const config = await DaVinciApi.initializeComplete(
      this.loggerService.logger
    );
    this.appName = <string>(<unknown>config.name);
    this.channelToDaVinci = config.ChannelToDaVinci.variables; // Maps Channel Presence to DaVinci presence
    this.DaVinciToChannel = config.DaVinciToChannel.variables; // Maps DaVinci Presence to Channel presence
    this.connectCcpUrl = config.variables.ConnectCcpUrl;
    this._connectService.presence.subscribe(this.onConnectPresenceChanged);
    this._connectService.setSupportedChannels$.subscribe((username) => {
      setSupportedChannels([
        {
          channelType: CHANNEL_TYPES.Telephony,
          idName: 'Agent',
          id: username,
          validOperations: [
            CONTEXTUAL_OPERATION_TYPE.BlindTransfer,
            CONTEXTUAL_OPERATION_TYPE.Conference,
            CONTEXTUAL_OPERATION_TYPE.Consult,
            CONTEXTUAL_OPERATION_TYPE.WarmTransfer
          ],
          validPresences: ['Ready']
        }
      ]);
    });
  }

  getLastConnectPresence() {
    return this.lastConnectPresence;
  }

  onClickToToDial = async (number: string) => {
    try {
      this.loggerService.logger.logDebug(
        `Channel API onClickToToDial:
        number=${number}`
      );
      this._connectService.MakeOutboundCall(number);
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API onClickToToDial:
        number=${number}
        error=${JSON.stringify(e)}`
      );
    }
  };

  logout = async (reason?: string): Promise<void> => {
    this.loggerService.logger.logInformation(
      'received logout event from DaVinci, attempting to log out of AmazonConnect...'
    );
    if (this._connectService.getPopup()) {
      (await this._connectService.initLogoutFromConnect()).self.close();
    }
    return Promise.resolve();
  };

  onConnectPresenceChanged = (connectPresence: string) => {
    try {
      if (connectPresence !== this.lastConnectPresence) {
        this.loggerService.logger.logDebug(
          `Channel API onConnectPresenceChanged:
          connectPresence=${connectPresence}`
        );
        this.lastConnectPresence = connectPresence;

        const daVinciPresence = this.channelToDaVinci[connectPresence];

        if (daVinciPresence === undefined) {
          this.loggerService.logger.logDebug(
            `Channel API onConnectPresenceChanged:
            Unknown Presence=${connectPresence}`
          );
        } else {
          if (daVinciPresence !== this.lastDaVinciPresence) {
            const presenceArray: string[] = daVinciPresence.split('|');
            const newPresence: string = presenceArray[0];

            this.lastDaVinciPresence = daVinciPresence;

            if (presenceArray.length > 1) {
              const newReason = presenceArray[1];
              DaVinciApi.setPresence(newPresence, newReason);
            } else {
              DaVinciApi.setPresence(newPresence);
            }
          }
        }
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API onConnectPresenceChanged:
        connectPresence=${connectPresence}
        error=${JSON.stringify(e)}`
      );
    }
  };

  onDaVinciPresenceChanged = async (
    daVinciPresence: string,
    reason?: string,
    initiatingApp?: string
  ) => {
    if (initiatingApp !== this.appName) {
      try {
        if (daVinciPresence !== this.lastDaVinciPresence) {
          this.loggerService.logger.logDebug(
            `Channel API onDaVinciPresenceChanged:
            daVinciPresence=${daVinciPresence}`
          );

          if (daVinciPresence === null || daVinciPresence === '') {
            this.loggerService.logger.logError(
              'Amazon Connect CTI - Channel API Service : onDaVinciPresenceChanged : presence is null or empty'
            );
            return;
          }
          let newDaVinciPresence = daVinciPresence;
          if (reason !== null) {
            if (reason === '') {
              this.loggerService.logger.logError(
                'Amazon Connect CTI - Channel API Service : onDaVinciPresenceChanged : reason is not null and empty'
              );
              return;
            }
            newDaVinciPresence += '|' + reason;
          }

          const connectPresence = this.DaVinciToChannel[newDaVinciPresence];

          if (!connectPresence) {
            this.loggerService.logger.logDebug(
              `Channel API onDaVinciPresenceChanged:
              Unknown connectPresence. DaVinci Presence=${daVinciPresence}`
            );
          } else if (connectPresence !== this.lastConnectPresence) {
            await this._connectService.setPresence(connectPresence);
            DaVinciApi.setPresence(daVinciPresence, reason);
            this.lastDaVinciPresence = newDaVinciPresence;
            this.lastConnectPresence = connectPresence;
          }
        }
      } catch (e) {
        this.loggerService.logger.logError(
          `Channel API onDaVinciPresenceChanged:
          daVinciPresence=${daVinciPresence}
          error=${JSON.stringify(e)}`
        );
      }
    }
  };

  ContextualControlCallback(
    contact: DaVinciApi.IContextualContact
  ): Promise<void> {
    try {
      this.loggerService.logger.logDebug(
        `Channel API ContextualControlCallback:
        contact=${JSON.stringify(contact)}`
      );
      this._connectService.MakeOutboundCall(getContactId(contact));
      return Promise.resolve();
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API ContextualControlCallback:
        contact=${JSON.stringify(contact)}
        error=${JSON.stringify(e)}`
      );
    }
  }

  setInteraction(interaction: IInteraction) {
    try {
      this.loggerService.logger.logDebug(
        `Channel API setInteraction:
        interaction=${JSON.stringify(interaction)}`
      );
      return DaVinciApi.setInteraction(interaction);
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API setInteraction:
        interaction=${JSON.stringify(interaction)}
        error=${JSON.stringify(e)}`
      );
    }
  }
}

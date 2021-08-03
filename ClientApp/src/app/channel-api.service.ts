import { Injectable } from '@angular/core';
import * as ChannelApi from '@amc-technology/davinci-api';
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
  public connectToDaVinci = {};
  public DaVinciToConnect = {};
  public connectCcpUrl;
  private lastConnectPresence = '';
  private lastDaVinciPresence = '';
  constructor(
    private _connectService: ConnectService,
    private loggerService: LoggerService
  ) {}

  async initialize() {
    await ChannelApi.registerContextualControls(
      this.ContextualControlCallback.bind(this)
    );
    await ChannelApi.registerOnPresenceChanged(this.onDaVinciPresenceChanged);
    await ChannelApi.registerClickToDial(this.onClickToToDial);
    await ChannelApi.registerOnLogout(this.logout);
    const config = await ChannelApi.initializeComplete(
      this.loggerService.logger
    );
    this.connectToDaVinci =
      config.ConnectToContactCanvasPresenceMapping.variables;
    this.DaVinciToConnect =
      config.ContactCanvasToConnectPresenceMapping.variables;
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
        const daVinciPresence = this.connectToDaVinci[connectPresence];
        if (daVinciPresence && daVinciPresence !== this.lastDaVinciPresence) {
          ChannelApi.setPresence(daVinciPresence);
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
    reason?: string
  ) => {
    try {
      if (daVinciPresence !== this.lastDaVinciPresence) {
        this.loggerService.logger.logDebug(
          `Channel API onDaVinciPresenceChanged:
          daVinciPresence=${daVinciPresence}`
        );
        this.lastDaVinciPresence = daVinciPresence;
        const connectPresence = this.DaVinciToConnect[daVinciPresence];
        if (connectPresence && connectPresence !== this.lastConnectPresence) {
          await this._connectService.setPresence(connectPresence);
          ChannelApi.setPresence(daVinciPresence, reason);
        }
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API onDaVinciPresenceChanged:
        daVinciPresence=${daVinciPresence}
        error=${JSON.stringify(e)}`
      );
    }
  };

  ContextualControlCallback(
    contact: ChannelApi.IContextualContact
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
      return ChannelApi.setInteraction(interaction);
    } catch (e) {
      this.loggerService.logger.logError(
        `Channel API setInteraction:
        interaction=${JSON.stringify(interaction)}
        error=${JSON.stringify(e)}`
      );
    }
  }
}

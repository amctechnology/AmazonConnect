import { Injectable } from '@angular/core';
import { IMetadata } from '@amc-technology/ui-library';
import * as api from '@amc-technology/davinci-api';
import { ConnectService } from './connect.service';
import { LoggerService } from './logger.service';
import { IConfiguration } from './model/IConfiguration';
import { ConfigurationService } from './configuration.service';
import { IContextualContact } from '@amc-technology/davinci-api';
import { getContactId } from './util/getContactId';

@Injectable({
  providedIn: 'root'
})
export class ConnectInteractionOperationsService {
  private config: IConfiguration;

  constructor(
    private configService: ConfigurationService,
    private _connectService: ConnectService,
    private loggerService: LoggerService
  ) {}

  initialize(): void {
    this.config = this.configService.config; // Initialize config on first line as subsequent methods will be accessing this variable.
  }

  public hangupOperationBuilder(contactid: string, connectionid?: string) {
    return {
      operationName: 'Hang Up',
      icon: new URL(this.config.iconPack + 'voice_end_normal.png'),
      title: 'Hang Up',
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService hangupOperation triggered
            uuid=${contactid}`
          );
          this._connectService.EndCall(contactid, connectionid);
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService hangupOperation:
            uuid=${contactid}
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public disabledEndCall(contactId: string, connectionId: string) {
    return {
      operationName: 'Hang Up',
      icon: this.config.iconPack + 'voice_end_normal.png',
      title: 'Hang Up',
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        this._connectService.EndCall(contactId, connectionId);
      }
    };
  }

  public blindTransferBuilder() {
    return {
      operationName: 'Blind Transfer',
      icon: new URL(this.config.iconPack + 'voice_blindtransfer_normal.png'),
      title: 'Blind Transfer',
      handler: async (
        operationName: string,
        operationMetadata?: IMetadata[]
      ) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService blindTransferOperation triggered
            uuid=$`
          );
          const contact = await api
            .contextualOperation(
              api.CONTEXTUAL_OPERATION_TYPE.BlindTransfer,
              api.CHANNEL_TYPES.Telephony
            )
            .catch((error) => {
              console.log('Blind Transfer failed.');
            });
          if (contact) {
            this._connectService.coldTransferCall(getContactId(contact));
          }
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService blindTransferOperation:
            uuid=
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public processTransfer(contactId: string, transferType: string) {
    return {
      operationName: 'Join and drop',
      icon: new URL(this.config.iconPack + 'voice_check_normal.png'),
      title: transferType,
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService hangupOperation triggered
            uuid=$`
          );
          if (transferType === 'Warm Transfer') {
            this._connectService.completeWarmTransfer();
          } else {
            this._connectService.conferenceCall(contactId);
          }
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService hangupOperation:
            uuid=
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public conferenceBuilder() {
    return {
      operationName: 'Conference',
      icon: new URL(this.config.iconPack + 'voice_conference_normal.png'),
      title: 'Conference',
      handler: async (
        operationName: string,
        operationMetadata?: IMetadata[]
      ) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService hangupOperation triggered
            uuid=$`
          );
          const contact: api.IContextualContact = await api
            .contextualOperation(
              api.CONTEXTUAL_OPERATION_TYPE.Conference,
              api.CHANNEL_TYPES.Telephony
            )
            .catch((error) => {
              console.log('Conference failed.');
              return null;
            });
          if (contact.displayName) {
            this._connectService.warmTransferCall(
              getContactId(contact),
              'conference'
            );
          }
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService hangupOperation:
            uuid=
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public warmTransferBuilder() {
    return {
      operationName: 'Warm Transfer',
      icon: new URL(this.config.iconPack + 'voice_warmtransfer_normal.png'),
      title: 'Warm Transfer',
      handler: async (
        operationName: string,
        operationMetadata?: IMetadata[]
      ) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService hangupOperation triggered
            uuid=$`
          );
          const contact: api.IContextualContact = await api
            .contextualOperation(
              api.CONTEXTUAL_OPERATION_TYPE.WarmTransfer,
              api.CHANNEL_TYPES.Telephony
            )
            .catch((error) => {
              console.log('Blind Transfer failed.');
              return null;
            });
          if (contact.displayName) {
            this._connectService.warmTransferCall(getContactId(contact));
          }
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService hangupOperation:
            uuid=
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public answerOperationBuilder(uuid: string) {
    return {
      operationName: 'Answer',
      icon: new URL(this.config.iconPack + 'voice_alerting_answer_normal.gif'),
      title: 'Answer',
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService answerOperation triggered
            uuid=${uuid}`
          );
          this._connectService.AnswerCall(uuid);
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService answerOperation:
            uuid=${uuid}
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public holdOperationBuilder(uuid: string) {
    return {
      operationName: 'Hold',
      icon: new URL(this.config.iconPack + 'voice_hold_normal.png'),
      title: 'Hold',
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService holdOperation triggered
            uuid=${uuid}`
          );
          this._connectService.HoldCall(uuid);
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService holdOperation:
            uuid=${uuid}
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }

  public resumeOperationBuilder(uuid: string) {
    return {
      operationName: 'Resume',
      icon: new URL(this.config.iconPack + 'voice_unhold_normal.png'),
      title: 'Resume',
      handler: (operationName: string, operationMetadata?: IMetadata[]) => {
        try {
          this.loggerService.logger.logDebug(
            `ConnectInteractionOperationsService resumeOperation triggered
            uuid=${uuid}`
          );
          this._connectService.ResumeCall(uuid);
        } catch (e) {
          this.loggerService.logger.logError(
            `ConnectInteractionOperationsService resumeOperation:
            uuid=${uuid}
            error=${JSON.stringify(e)}`
          );
        }
      }
    };
  }
}

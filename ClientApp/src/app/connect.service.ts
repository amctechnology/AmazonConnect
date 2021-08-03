import { Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { IAction, ACTION_TYPE, DIRECTION } from './redux/action';
import { IAppState } from './redux/state';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { LoggerService } from './logger.service';
import { ChannelApiService } from './channel-api.service';
import * as ChannelApi from '@amc-technology/davinci-api';
import {
  setSupportedChannels,
  CHANNEL_TYPES,
  CONTEXTUAL_OPERATION_TYPE,
  contextualOperation
} from '@amc-technology/davinci-api';

declare let connect: any;

@Injectable({
  providedIn: 'root'
})
export class ConnectService {
  public presence = new BehaviorSubject<string>('');
  public setSupportedChannels$ = new ReplaySubject<string>(1);
  private containerDiv: any;
  public connectionPool: {
    [connId: string]: boolean;
  };

  lastPresence: string;
  outboundCall: string;
  private _agent: any;
  private _configs: any;
  private _popup: any = true;
  private internalTransferEndpoints: [any];
  private contactsPartyList: { [contactId: string]: number } = {};

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private loggerService: LoggerService
  ) {
    this.connectionPool = {};
  }

  async StartAmazonConnect(ccpUrl, div: any): Promise<void> {
    try {
      this.loggerService.logger.logDebug(
        'ConnectService starting amazon connect'
      );
      ChannelApi.enableClickToDial(true);
      this.containerDiv = div;
      connect.core.initCCP(this.containerDiv, {
        ccpUrl: ccpUrl,
        loginPopup: false,
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: true
        }
      });
      this.InitAgent();
      const loginPopup = window.open(ccpUrl, connect.MasterTopics.LOGIN_POPUP);
      connect.contact((contact) => this.ContactCallback(contact));
      // 2 lines below detect if we logged out of AmazonConnect
      this.getEventBus().subscribe(connect.EventType.TERMINATED, () => {
        this.setPopup(false);
        ChannelApi.logout();
      });
      this.getEventBus().subscribe(connect.EventType.ACKNOWLEDGE, () => {
        loginPopup.close();
      });

      // The follow checks for contacts dropping conference calls
      window.setInterval(() => {
        const contacts = this._agent.getContacts();
        const contactsPartyList = {};
        for (const contact of contacts) {
          const id = contact.getContactId();
          const contactConnections = contact
            .getConnections()
            .filter(
              (connection) => connection.getStatus().type !== 'disconnected'
            );
          const parties = contactConnections.length;
          contactsPartyList[id] = parties;

          if (
            this.contactsPartyList[id] != null &&
            this.contactsPartyList[id] > parties
          ) {
            const connections = [];
            for (let index = 0; index < contactConnections.length; index++) {
              if (
                contactConnections[index].getEndpoint() &&
                contactConnections[index].getEndpoint().type !== 'agent'
              ) {
                connections.push({
                  phoneNumber:
                    contactConnections[index].getEndpoint().phoneNumber,
                  connectionId: contactConnections[index].connectionId,
                  status: contactConnections[index].getStatus().type
                });
              }
            }
            const action: IAction = {
              type: ACTION_TYPE.conferencePartyLeft,
              number: connections[0].phoneNumber,
              direction: contact.isInbound()
                ? DIRECTION.inbound
                : DIRECTION.outbound,
              uuid: id,
              connections
            };
            this.ngRedux.dispatch(action);
          }
        }
        this.contactsPartyList = contactsPartyList;
      }, 500);
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService StartAmazonConnect:
        error=${JSON.stringify(e)}`
      );
    }
  }

  getEventBus = () => {
    const eventBus = connect.core.getEventBus();
    return eventBus;
  };

  InitAgent() {
    connect.agent((agent) => {
      const config = agent.getConfiguration();
      this.setSupportedChannels$.next(config.username);

      agent.getEndpoints(agent.getAllQueueARNs(), {
        success: (data) => {
          let internalTransfers: [Object];
          if (Array.isArray(data.endpoints)) {
            internalTransfers = data.endpoints.filter(
              (ep) => ep.type === 'agent'
            );
          }
          this.internalTransferEndpoints = internalTransfers;
        },
        failure: () => {
          this.loggerService.logger.logError('Failed getting all queue ARNs');
        }
      });

      this.presence.next(agent.getState().name);
      agent.onStateChange((state) => {
        this.presence.next(state.newState);
      });
      this._agent = agent;
    });
  }

  async setAppConfig(configs) {
    this._configs = configs;
  }

  getAppConfig() {
    return this._configs;
  }

  setPopup(popup: boolean) {
    this._popup = popup;
  }

  getPopup() {
    return this._popup;
  }

  async initLogoutFromConnect() {
    const logoutLink = this._configs.LogoutLink;
    const popupConfig =
      'height=1, width=1, status=no, toolbar=no, menubar=no, location=no, top = 100000, left=100000 ';
    return await window.self.open(logoutLink, 'Popup', popupConfig);
  }

  setPresence(presenceName: string) {
    return new Promise<void>((resolve, reject) => {
      const newState = this._agent
        .getAgentStates()
        .find((state) => state.name === presenceName);
      this._agent.setState(newState, {
        success: () => {
          resolve();
        },
        failure: (e) => {
          this.loggerService.logger.logError(
            `ConnectService setPresence:
            error=${JSON.stringify(e)}`
          );
        }
      });
    });
  }

  MakeOutboundCall(dialNumber: string) {
    const endpoint = this.getEndpoint(dialNumber);
    this._agent.connect(endpoint, {
      success: () => {
        this.loggerService.logger.logDebug(
          `ConnectService MakeOutboundCall successful
          dialNumber=${dialNumber}`
        );
      },
      failure: (e) => {
        this.loggerService.logger.logError(
          `ConnectService MakeOutboundCall:
          dialNumber=${dialNumber}
          error=${JSON.stringify(e)}`
        );
      }
    });
  }

  async ContactCallback(contact: any) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService received new contact
        contactId=${contact.getContactId()}
        type=${contact.getType()}
        status=${JSON.stringify(contact.getStatus())}
        isSoftphoneCall=${contact.isSoftphoneCall()}
        isInbound=${contact.isInbound()}
        attributes=${JSON.stringify(contact.getAttributes())}`
      );
      if (contact.isSoftphoneCall() && contact.getStatus().type !== 'error') {
        const name = contact.getAttributes();
        const conns = contact.getConnections();
        if (contact.getStatus().type === 'ended') {
          conns.destroy();
        }
        contact.onEnded(() => {
          const connections = contact.getConnections();
          const endpoint = connections[1].getEndpoint();
          const phonenumber = endpoint.stripPhoneNumber().substring(1);
          const action: IAction = {
            type: ACTION_TYPE.completed,
            uuid: contact.getContactId(),
            number: phonenumber
          };
          this.ngRedux.dispatch(action);
        });
        if (contact.isInbound()) {
          this.ProcessInboundCall(contact, name, conns);
        } else {
          this.ProcessOutboundCall(contact, name, conns);
        }
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService ContactCallback:
        contactId=${contact.getContactId()}
        error=${JSON.stringify(e)}`
      );
    }
  }

  ProcessOutboundCall(contact: any, name: any, conns: any) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService ProcessOutboundCall: processing outbound call
        contactId=${contact.getContactId()}`
      );
      const endpoint = conns[1].getEndpoint();
      const phonenumber = endpoint.stripPhoneNumber().substring(1);
      this.outboundCall = contact.getContactId();
      this.loggerService.logger.logDebug(
        `ConnectService ProcessOutboundCall: phone number found
        contactId=${contact.getContactId()}
        phoneNumber=${phonenumber}`
      );
      const action: IAction = {
        type: ACTION_TYPE.ringing,
        number: phonenumber,
        direction: DIRECTION.outbound,
        uuid: this.outboundCall,
        connections: [
          { connectionId: contact.getConnections()[1].connectionId }
        ]
      };
      this.ngRedux.dispatch(action);
      contact.onConnected(() =>
        this.OnConnectedCallback(
          phonenumber,
          DIRECTION.outbound,
          this.outboundCall,
          contact.getConnections()[1].connectionId
        )
      );
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService ProcessOutboundCall:
        contactId=${contact.getContactId()}
        error=${JSON.stringify(e)}`
      );
    }
  }

  OnConnectedCallback(
    phonenumber: string,
    direction: DIRECTION,
    callId: string,
    connectionId?: string
  ) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService OnConnectedCallback: call connected
        contactId=${callId}
        phoneNumber=${phonenumber}`
      );
      const action: IAction = {
        type: ACTION_TYPE.answered,
        number: phonenumber,
        direction: direction,
        uuid: callId,
        connections: [{ connectionId: connectionId }]
      };
      this.ngRedux.dispatch(action);
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService OnConnectedCallback:
        contactId=${callId}
        error=${JSON.stringify(e)}`
      );
    }
  }

  async conferenceCall(contactId?: string) {
    if (contactId) {
      this._agent.getContacts().forEach((contact) => {
        if (contact.contactId === contactId) {
          contact.conferenceConnections({
            success: () => {
              const agentConns = contact.getConnections();
              const connections = [];
              for (let index = 0; index < agentConns.length; index++) {
                if (
                  agentConns[index].getEndpoint() &&
                  agentConns[index].getEndpoint().type !== 'agent'
                ) {
                  connections.push({
                    phoneNumber: agentConns[index].getEndpoint().phoneNumber,
                    connectionId: agentConns[index].connectionId
                  });
                }
              }
              const action: IAction = {
                type: ACTION_TYPE.completedConference,
                uuid: contact.getContactId(),
                connections: connections
              };
              this.ngRedux.dispatch(action);
            },
            failure: () => {
              console.log('error');
            }
          });
        }
      });
    } else {
      this._agent.getContacts().forEach((contact) => {
        contact.conferenceConnections({
          success: () => {
            const agentConns = contact.getConnections();
            const connections = [];
            for (let index = 0; index < agentConns.length; index++) {
              if (
                agentConns[index].getEndpoint() &&
                agentConns[index].getEndpoint().type !== 'agent'
              ) {
                connections.push({
                  phoneNumber: agentConns[index].getEndpoint().phoneNumber,
                  connectionId: agentConns[index].connectionId
                });
              }
            }
            const action2: IAction = {
              type: ACTION_TYPE.completedConference,
              uuid: contact.getContactId(),
              connections: connections
            };
            this.ngRedux.dispatch(action2);
          },
          failure: () => {
            console.log('error');
          }
        });
      });
    }
  }

  async completeWarmTransfer() {
    this._agent.getContacts().forEach((contact) => {
      contact.conferenceConnections({
        success: () => {
          contact.getAgentConnection().destroy({
            success: () => {
              const action: IAction = {
                type: ACTION_TYPE.completedTransfer,
                uuid: contact.getContactId()
              };
              this.ngRedux.dispatch(action);
            },
            failure: () => {
              console.error('failed to end the call!');
            }
          });
        },
        failure: () => {
          console.log('error');
        }
      });
    });
  }

  async warmTransferCall(
    phoneNumber: string,
    transferType: string = '',
    contactId?: string
  ) {
    const getOurAvailableContacts = this._agent.getContacts();
    let ourContactId;
    if (contactId) {
      ourContactId = contactId;
    } else {
      ourContactId = this._agent
        .getContacts()
        .find((aContact) => aContact.getContactId());
    }
    let oContactId;
    let trueUUID;
    getOurAvailableContacts.forEach((contact) => {
      trueUUID = contact.getConnections()[0].getConnectionId();
      oContactId = { contactId: contact.contactId };
      if (JSON.stringify(oContactId) === JSON.stringify(ourContactId)) {
        const endpoint = this.getEndpoint(phoneNumber);

        const trueUUID2 = contact.getConnections()[0].getContactId();
        this.HoldCall(trueUUID2);

        this._agent
          .getContacts(connect.ContactType.VOICE)[0]
          .addConnection(endpoint, {
            success: (resp) => {
              const bus = this.getEventBus();
              bus.subscribe(
                contact.getEventName(connect.ContactEvents.REFRESH),
                () => {
                  if (contact) {
                    const connections = contact.getConnections();
                    const outboundConnection =
                      connections[connections.length - 1];
                    if (
                      !this.connectionPool[outboundConnection.getConnectionId()]
                    ) {
                      this.connectionPool[
                        outboundConnection.getConnectionId()
                      ] = false;
                    }
                    if (
                      outboundConnection &&
                      outboundConnection.isConnected() &&
                      !this.connectionPool[outboundConnection.getConnectionId()]
                    ) {
                      this.connectionPool[
                        outboundConnection.getConnectionId()
                      ] = true;
                      const action: IAction = {
                        type:
                          transferType === 'conference'
                            ? ACTION_TYPE.conference
                            : ACTION_TYPE.warmtransfer,
                        number: phoneNumber,
                        direction: DIRECTION.outbound,
                        uuid: outboundConnection.getConnectionId(),
                        connections: [
                          { connectionId: outboundConnection.getConnectionId() }
                        ]
                      };
                      this.ngRedux.dispatch(action);
                    } else if (
                      outboundConnection &&
                      !outboundConnection.isActive() &&
                      this.connectionPool[outboundConnection.getConnectionId()]
                    ) {
                      delete this.connectionPool[
                        outboundConnection.getConnectionId()
                      ];
                    }
                  }
                }
              );
            },
            failure: () => {
              console.error('failed to add connection (transfer)!');
            }
          });
      }
    });
  }

  async coldTransferCall(phoneNumber: string) {
    const getContactsFromAmazon = this._agent.getContacts();
    const contactId = this._agent
      .getContacts()
      .find((aContact) => aContact.getContactId());
    let oContactId;
    getContactsFromAmazon.forEach((contact) => {
      oContactId = { contactId: contact.contactId };
      if (JSON.stringify(oContactId) === JSON.stringify(contactId)) {
        const endpoint = this.getEndpoint(phoneNumber);
        contact.addConnection(endpoint, {
          success: () => {
            console.log('+ added external connection');
            contact.getAgentConnection().destroy({
              success: () => {
                console.log('ended agent connection on successful transfer');
              },
              failure: () => {
                console.error('failed to end the call!');
              }
            });
          },
          failure: () => {
            console.error('failed to add connection (transfer)!');
          }
        });
      }
    });
  }

  ProcessInboundCall(contact: any, name: any, conns: any) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService ProcessInboundCall: processing inbound call
        contactId=${contact.getContactId()}`
      );
      const endpoint = conns[1].getEndpoint();
      const phonenumber = endpoint.stripPhoneNumber().substring(1);
      this.loggerService.logger.logDebug(
        `ConnectService ProcessInboundCall: phone number found
      contactId=${contact.getContactId()}
      phoneNumber=${phonenumber}`
      );
      const action: IAction = {
        type: ACTION_TYPE.ringing,
        number: phonenumber,
        direction: DIRECTION.inbound,
        uuid: contact.getContactId()
      };
      this.ngRedux.dispatch(action);

      contact.onConnected(() =>
        this.OnConnectedCallback(phonenumber, DIRECTION.inbound, action.uuid)
      );
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService ProcessInboundCall:
      contactId=${contact.getContactId()}
      error=${JSON.stringify(e)}`
      );
    }
  }

  EndCall(contactId: string, connectionId?: string) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService EndCall: ending call
        contactId=${contactId}`
      );
      const contact = this._agent
        .getContacts()
        .find((aContact) => aContact.contactId === contactId);
      if (contact) {
        if (connectionId) {
          contact.getConnections().forEach((element) => {
            if (connectionId === element.getConnectionId()) {
              // element.destroy();
              contact.getInitialConnection().destroy();
              const action: IAction = {
                type: ACTION_TYPE.completedTransfer,
                uuid: connectionId
              };
              // this.ngRedux.dispatch(action);
            }
          });
        } else {
          contact.getConnections().forEach((element) => {
            element.destroy();
          });
          contact.destroy();
        }
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService EndCall:
        contactId=${contactId}
        error=${JSON.stringify(e)}`
      );
    }
  }

  AnswerCall(contactId: string) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService AnswerCall: answering call
        contactId=${contactId}`
      );
      const contact = this._agent
        .getContacts()
        .find((aContact) => aContact.contactId === contactId);
      contact.accept({
        success: () => {
          this.loggerService.logger.logDebug(
            `ConnectService AnswerCall: successfully answered call
          contactId=${contactId}`
          );
        },
        failure: (e) => {
          this.loggerService.logger.logError(
            `ConnectService AnswerCall: failed to answer call
          contactId=${contactId}
          error=${JSON.stringify(e)}`
          );
        }
      });
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService AnswerCall:
      contactId=${contactId}
      error=${JSON.stringify(e)}`
      );
    }
  }

  HoldCall(contactId: string) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService HoldCall: putting call on hold
      contactId=${contactId}`
      );
      const contact = this._agent
        .getContacts()
        .find((aContact) => aContact.contactId === contactId);
      if (contact) {
        for (const connection of contact.getConnections()) {
          connection.hold({
            success: () => {
              this.loggerService.logger.logDebug(
                `ConnectService HoldCall: successfully put call on hold
              contactId=${contactId}`
              );
            },
            failure: (e) => {
              this.loggerService.logger.logError(
                `ConnectService HoldCall: failed to put call on hold
              contactId=${contactId}
              error=${JSON.stringify(e)}`
              );
            }
          });
        }
        const conns = contact.getConnections();
        const endpoint = conns[1].getEndpoint();
        const phonenumber = endpoint.stripPhoneNumber().substring(1);

        const action: IAction = {
          type: ACTION_TYPE.hold,
          uuid: contactId,
          number: phonenumber
        };
        this.ngRedux.dispatch(action);
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService HoldCall:
        contactId=${contactId}
        error=${JSON.stringify(e)}`
      );
    }
  }

  ResumeCall(contactId: string) {
    try {
      this.loggerService.logger.logDebug(
        `ConnectService ResumeCall: resuming call
      contactId=${contactId}`
      );
      const contact = this._agent
        .getContacts()
        .find((aContact) => aContact.contactId === contactId);
      if (contact) {
        for (const connection of contact.getConnections()) {
          connection.resume({
            success: () => {
              this.loggerService.logger.logDebug(
                `ConnectService ResumeCall: successfully resumed call
            contactId=${contactId}`
              );
            },
            failure: (e) => {
              this.loggerService.logger.logError(
                `ConnectService ResumeCall: failed to resume call
            contactId=${contactId}
            error=${JSON.stringify(e)}`
              );
            }
          });
        }
        const conns = contact.getConnections();
        const endpoint = conns[1].getEndpoint();
        const phonenumber = endpoint.stripPhoneNumber().substring(1);
        const action: IAction = {
          type: ACTION_TYPE.resume,
          uuid: contactId,
          number: phonenumber
        };
        this.ngRedux.dispatch(action);
      }
    } catch (e) {
      this.loggerService.logger.logError(
        `ConnectService ResumeCall:
      contactId=${contactId}
      error=${JSON.stringify(e)}`
      );
    }
  }

  getEndpoint(toCall: string) {
    toCall = toCall.replace(/[^0-9]/g, '');
    let endpoint = this.internalTransferEndpoints?.find(
      (anEndpoint) => anEndpoint.name === toCall
    );
    if (endpoint == null) {
      endpoint = connect.Endpoint.byPhoneNumber(toCall);
    }
    return endpoint;
  }
}

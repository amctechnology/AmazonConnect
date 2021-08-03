import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './app.component';
import { AmcConnectHomeComponent } from './amc-connect-home/amc-connect-home.component';
import { UILibraryModule } from '@amc-technology/ui-library';
import { ConnectService } from './connect.service';
import { ChannelApiService } from './channel-api.service';
import { LoggerService } from './logger.service';
import { NgRedux, NgReduxModule } from '@angular-redux/store';
import { IAppState } from './redux/state';
import { ConnectEpicsService } from './redux/connect-epics.service';
import { ConnectInteractionOperationsService } from './connect-interaction-operations.service';
import { rootReducer } from './redux/reducers';
import { ConfigurationService } from './configuration.service';
import { HttpClientModule } from '@angular/common/http';
import { createEpicMiddleware } from 'redux-observable-es6-compat';

@NgModule({
  declarations: [AppComponent, AmcConnectHomeComponent],
  imports: [BrowserModule, UILibraryModule, HttpClientModule, NgReduxModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory:
        (
          configService: ConfigurationService,
          loggerService: LoggerService,
          cioService: ConnectInteractionOperationsService,
          connectService: ConnectService,
          capiService: ChannelApiService
        ) =>
        async () => {
          await configService.loadConfigurationData();
          loggerService.initialize();
          cioService.initialize();
          await capiService.initialize();
        },
      deps: [
        ConfigurationService,
        LoggerService,
        ConnectInteractionOperationsService,
        ConnectService,
        ChannelApiService,
        ConnectEpicsService
      ],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    ngRedux: NgRedux<IAppState>,
    private configurationService: ConfigurationService,
    interactionOperations: ConnectInteractionOperationsService,
    epics: ConnectEpicsService
  ) {
    const epicMiddleware = createEpicMiddleware();

    const operationsMiddleware = (store) => (next) => (action) => {
      const newAction = Object.assign({}, action, {
        operations: interactionOperations,
        iconPack: this.configurationService.config.iconPack
      });
      return next(newAction);
    };

    const middleware = [
      (store) => (next) => (action) => {
        try {
          next(action);
        } catch (e) {
          console.log(e);
        }
      },
      operationsMiddleware,
      epicMiddleware
    ];

    ngRedux.configureStore(rootReducer, { scenarios: [] }, middleware);

    epicMiddleware.run(epics.rootEpic);
  }
}

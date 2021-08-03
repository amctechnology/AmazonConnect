import { Component, AfterViewChecked, ElementRef, OnInit } from '@angular/core';
import { ConnectService } from './connect.service';
import * as ChannelApi from '@amc-technology/davinci-api';
import { LoggerService } from './logger.service';
import { ChannelApiService } from './channel-api.service';
import { IAppConfiguration } from '@amc-technology/davinci-api';
@Component({
  selector: 'amc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewChecked, OnInit {
  title = 'Amazon Connect';
  height: number;
  el: ElementRef;
  configs: any;
  showAmazonUI = false;
  amazonUIHeight: number;
  constructor(
    el: ElementRef,
    private _connectService: ConnectService,
    private _channelService: ChannelApiService
  ) {
    this.el = el;
  }

  async ngOnInit() {
    const connectDiv = this.el.nativeElement.querySelector('#divConnectLib');
    this._connectService.StartAmazonConnect(
      this._channelService.connectCcpUrl,
      connectDiv
    );
    const configs = await ChannelApi.getConfig();
    this._connectService.setAppConfig(configs.variables);
    this.showAmazonUI = configs.variables.showAmazonUI === true;
    this.amazonUIHeight = <number>configs.variables.amazonUIHeight || 300;
  }

  ngAfterViewChecked(): void {
    this.setHeight();
  }

  private setHeight(): void {
    const newHeight = this.getHeight();
    if (newHeight !== this.height) {
      this.height = newHeight;
      ChannelApi.setAppHeight(this.height);
    }
  }

  private getHeight(): number {
    // return this.el.nativeElement.children[0].scrollHeight + 25;
    return this.el.nativeElement.scrollHeight + 25;
  }
}

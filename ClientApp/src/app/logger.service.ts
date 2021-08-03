import { Injectable } from '@angular/core';
import { Logger, LOG_SOURCE } from '@amc-technology/davinci-api';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  public logger: Logger;

  constructor(private configService: ConfigurationService) {}
  initialize() {
    this.logger = new Logger(
      LOG_SOURCE.AmazonConnect,
      false,
      this.configService.config.apiUrl
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { IScenario } from '@amc-technology/ui-library';
import { ConnectService } from '../connect.service';
@Component({
  selector: 'amc-connect-home',
  templateUrl: './amc-connect-home.component.html',
  styleUrls: ['./amc-connect-home.component.css']
})
export class AmcConnectHomeComponent {
  @select() scenarios$: Observable<IScenario[]>;

  constructor(private connectService: ConnectService) {}
}

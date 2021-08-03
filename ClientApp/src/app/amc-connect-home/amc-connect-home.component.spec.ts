import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmcConnectHomeComponent } from './amc-connect-home.component';

describe('AmcConnectHomeComponent', () => {
  let component: AmcConnectHomeComponent;
  let fixture: ComponentFixture<AmcConnectHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AmcConnectHomeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmcConnectHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

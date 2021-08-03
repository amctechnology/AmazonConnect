import { TestBed } from '@angular/core/testing';

import { ChannelApiService } from './channel-api.service';

describe('ChannelApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ChannelApiService = TestBed.get(ChannelApiService);
    expect(service).toBeTruthy();
  });
});

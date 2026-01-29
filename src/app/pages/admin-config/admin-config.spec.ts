import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminConfig } from './admin-config';

describe('AdminConfig', () => {
  let component: AdminConfig;
  let fixture: ComponentFixture<AdminConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

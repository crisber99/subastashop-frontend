import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminReportes } from './super-admin-reportes';

describe('SuperAdminReportes', () => {
  let component: SuperAdminReportes;
  let fixture: ComponentFixture<SuperAdminReportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminReportes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminReportes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

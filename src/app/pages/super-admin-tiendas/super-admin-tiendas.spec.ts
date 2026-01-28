import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperAdminTiendas } from './super-admin-tiendas';

describe('SuperAdminTiendas', () => {
  let component: SuperAdminTiendas;
  let fixture: ComponentFixture<SuperAdminTiendas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminTiendas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperAdminTiendas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartFloat } from './cart-float';

describe('CartFloat', () => {
  let component: CartFloat;
  let fixture: ComponentFixture<CartFloat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartFloat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartFloat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

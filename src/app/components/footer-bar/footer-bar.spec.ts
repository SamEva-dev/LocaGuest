import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterBar } from './footer-bar';

describe('FooterBar', () => {
  let component: FooterBar;
  let fixture: ComponentFixture<FooterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

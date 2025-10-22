import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UseTemplate } from './use-template';

describe('UseTemplate', () => {
  let component: UseTemplate;
  let fixture: ComponentFixture<UseTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UseTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UseTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

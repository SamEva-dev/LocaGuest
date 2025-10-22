import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTemplate } from './new-template';

describe('NewTemplate', () => {
  let component: NewTemplate;
  let fixture: ComponentFixture<NewTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

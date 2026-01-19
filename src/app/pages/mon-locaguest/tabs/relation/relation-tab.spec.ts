import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationTab } from './relation-tab';

describe('RelationTab', () => {
  let component: RelationTab;
  let fixture: ComponentFixture<RelationTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelationTab]
    })
      .overrideTemplate(RelationTab, '')
      .compileComponents();

    fixture = TestBed.createComponent(RelationTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

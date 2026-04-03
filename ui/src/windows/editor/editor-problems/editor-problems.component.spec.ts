import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorProblemsComponent } from './editor-problems.component';

describe('EditorProblemsComponent', () => {
  let component: EditorProblemsComponent;
  let fixture: ComponentFixture<EditorProblemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorProblemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorProblemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

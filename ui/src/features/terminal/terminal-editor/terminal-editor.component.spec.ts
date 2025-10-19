import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalEditorComponent } from './terminal-editor.component';

describe('TerminalEditorComponent', () => {
  let component: TerminalEditorComponent;
  let fixture: ComponentFixture<TerminalEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminalEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

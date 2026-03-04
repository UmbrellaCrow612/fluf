import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorMainContentManagerComponent } from './editor-main-content-manager.component';

describe('EditorMainContentManagerComponent', () => {
  let component: EditorMainContentManagerComponent;
  let fixture: ComponentFixture<EditorMainContentManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorMainContentManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorMainContentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

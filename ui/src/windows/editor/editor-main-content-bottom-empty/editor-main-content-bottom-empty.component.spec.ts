import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorMainContentBottomEmptyComponent } from './editor-main-content-bottom-empty.component';

describe('EditorMainContentBottomEmptyComponent', () => {
  let component: EditorMainContentBottomEmptyComponent;
  let fixture: ComponentFixture<EditorMainContentBottomEmptyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorMainContentBottomEmptyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorMainContentBottomEmptyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileXToolBarDirectoryPathViewerComponent } from './file-x-tool-bar-directory-path-viewer.component';

describe('FileXToolBarDirectoryPathViewerComponent', () => {
  let component: FileXToolBarDirectoryPathViewerComponent;
  let fixture: ComponentFixture<FileXToolBarDirectoryPathViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileXToolBarDirectoryPathViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileXToolBarDirectoryPathViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

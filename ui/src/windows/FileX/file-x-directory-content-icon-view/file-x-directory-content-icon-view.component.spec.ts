import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileXDirectoryContentIconViewComponent } from './file-x-directory-content-icon-view.component';

describe('FileXDirectoryContentIconViewComponent', () => {
  let component: FileXDirectoryContentIconViewComponent;
  let fixture: ComponentFixture<FileXDirectoryContentIconViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileXDirectoryContentIconViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileXDirectoryContentIconViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

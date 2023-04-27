import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { LoginscreenPage } from './loginscreen.page';

describe('LoginscreenPage', () => {
  let component: LoginscreenPage;
  let fixture: ComponentFixture<LoginscreenPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(LoginscreenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

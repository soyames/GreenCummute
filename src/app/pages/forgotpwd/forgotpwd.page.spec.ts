import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotpwdPage } from './forgotpwd.page';

describe('ForgotpwdPage', () => {
  let component: ForgotpwdPage;
  let fixture: ComponentFixture<ForgotpwdPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ForgotpwdPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

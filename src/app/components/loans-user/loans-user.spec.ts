import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoansUser } from './loans-user';

describe('LoansUser', () => {
  let component: LoansUser;
  let fixture: ComponentFixture<LoansUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoansUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoansUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

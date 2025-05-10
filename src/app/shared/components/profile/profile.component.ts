// import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

// https://github.com/abacritt/angularx-social-login

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [NgIf, MatMiniFabButton, MatIcon]
})
export class ProfileComponent implements OnInit {
  // socialUser!: SocialUser;
  isLoggedin: boolean = false;

  constructor(
    // private socialAuthService: SocialAuthService, 
    private _router: Router
  ) {}
  
  async ngOnInit(): Promise<void> {
    if (sessionStorage.getItem('token')) {
      this.isLoggedin = true;
    }
  }

  login(): void {
    this._router.navigate(['login']);
  }

  logout(): void {
    // if(this.socialUser !== null) {
    //   // console.log(this.socialUser)
    //   this.socialAuthService.signOut();
    // }

    sessionStorage.clear();
    this.isLoggedin = false;

    this._router.navigate(['login']);
  }
}

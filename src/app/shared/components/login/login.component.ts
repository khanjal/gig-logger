import { GoogleLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// https://github.com/abacritt/angularx-social-login

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  socialUser!: SocialUser;
  isLoggedin: boolean = false;
  
  constructor(
    private socialAuthService: SocialAuthService, public router: Router
  ) {}
  
  ngOnInit(): void {
    if (sessionStorage.getItem('token')) {
      this.isLoggedin = true;
    }
    else {
      // console.log('Logged out');
      this.socialAuthService.authState.subscribe((user) => {
        this.socialUser = user;
        this.isLoggedin = user != null;
        sessionStorage.setItem('token', this.socialUser?.idToken);
        // console.log(this.socialUser);
    });
    }
  }

  logOut(): void {
    if(this.socialUser !== null) {
      // console.log(this.socialUser)
      this.socialAuthService.signOut();
    }

    sessionStorage.clear();
    this.isLoggedin = false;

    this.router.navigate(['']);
  }
}

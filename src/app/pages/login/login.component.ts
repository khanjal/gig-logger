import { SocialUser, SocialAuthService } from '@abacritt/angularx-social-login';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  socialUser!: SocialUser;
  isLoggedin: boolean = false;

  constructor(
    private socialAuthService: SocialAuthService, public router: Router
  ) {}
  
  async ngOnInit(): Promise<void> {
      // console.log('Logged out');
      this.socialAuthService.authState.subscribe((user) => {
        this.socialUser = user;
        this.isLoggedin = user != null;
        sessionStorage.setItem('token', this.socialUser?.idToken);
        // console.log(this.socialUser);
    });
  }
}

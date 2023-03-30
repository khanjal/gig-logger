import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// https://github.com/abacritt/angularx-social-login

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  socialUser!: SocialUser;
  isLoggedin: boolean = false;

  constructor(
    private socialAuthService: SocialAuthService, public router: Router
  ) {}
  
  async ngOnInit(): Promise<void> {
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

    //let token = await this.socialAuthService.getAccessToken('1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com');
    
    //console.log(token);
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

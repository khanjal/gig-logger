import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OAuthService } from 'angular-oauth2-oidc';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppComponent
  ],
  providers: [
    OAuthService
  ],
})
export class AppModule { }
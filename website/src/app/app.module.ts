import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameStateDisplayComponent } from './game-state-display/game-state-display.component';
import { MatButtonModule } from '@angular/material/button';
import { GameResultPlayerComponent } from './game-result-player/game-result-player.component';

@NgModule({
  declarations: [
    AppComponent,
    GameStateDisplayComponent,
    GameResultPlayerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

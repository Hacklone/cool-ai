import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GameState } from '@cool/ai-rpg';

@Component({
  selector: 'app-game-state-display',
  templateUrl: './game-state-display.component.html',
  styleUrls: ['./game-state-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameStateDisplayComponent implements OnChanges {
  @Input()
  public gameState!: GameState;

  public ngOnChanges(changes: SimpleChanges): void {
  }
}

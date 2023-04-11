import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GameFieldDirection, GameObjectType, GameState } from '@cool/ai-rpg';

@Component({
  selector: 'app-game-state-display',
  templateUrl: './game-state-display.component.html',
  styleUrls: ['./game-state-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameStateDisplayComponent {
  @Input()
  public gameState!: GameState;

  protected readonly GameObjectType = GameObjectType;

  protected readonly GameFieldDirection = GameFieldDirection;

  protected FIELD_SIZE_PX = 16;
}

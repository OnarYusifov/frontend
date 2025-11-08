import { Component, computed, inject } from "@angular/core";
import {
  PlayerCombatCardComponent,
  PlayerCombatCardMinimalComponent,
} from "../player-combat-card/player-combat-card.component";
import { DataModelService } from "../../../services/dataModel.service";

@Component({
  selector: "app-combat-tracker",
  imports: [PlayerCombatCardComponent, PlayerCombatCardMinimalComponent],
  templateUrl: "./player-list.component.html",
  styleUrl: "./player-list.component.css",
})
export class CombatPlayerListComponent {
  dataModel = inject(DataModelService);

  isShown = computed(() => this.dataModel.match().roundPhase !== "shopping");
}

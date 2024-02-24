import { NgModule } from "@angular/core";
import { ShortAddressPipe } from "./short-address.pipe";
import { TruncatePipe } from "./truncate.pipe";
import { CommonModule } from "@angular/common";
import { NoSecondsPipe } from "./no-seconds.pipe";

@NgModule({
    declarations: [
        NoSecondsPipe,
        ShortAddressPipe, 
        TruncatePipe
    ],
    imports: [CommonModule],
    exports: [
        NoSecondsPipe,
        ShortAddressPipe,
        TruncatePipe
    ]
  })
  export class PipesModule {}
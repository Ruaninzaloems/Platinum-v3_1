import {
  MatTooltip,
  TooltipComponent
} from "./chunk-VB3YGSGB.js";
import {
  OverlayModule
} from "./chunk-D5V247A5.js";
import {
  A11yModule
} from "./chunk-WV7NP6Q4.js";
import {
  CdkScrollableModule
} from "./chunk-33QEHQ3V.js";
import {
  BidiModule
} from "./chunk-OBASGH4D.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-TIDIRMTG.js";
import {
  ɵɵdefineInjector
} from "./chunk-IXXODMXA.js";

// ../../node_modules/@angular/material/fesm2022/tooltip.mjs
var MatTooltipModule = class _MatTooltipModule {
  static ɵfac = function MatTooltipModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatTooltipModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatTooltipModule,
    imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
    exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [A11yModule, OverlayModule, BidiModule, CdkScrollableModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatTooltipModule, [{
    type: NgModule,
    args: [{
      imports: [A11yModule, OverlayModule, MatTooltip, TooltipComponent],
      exports: [MatTooltip, TooltipComponent, BidiModule, CdkScrollableModule]
    }]
  }], null, null);
})();

export {
  MatTooltipModule
};
//# sourceMappingURL=chunk-QLQETT4U.js.map

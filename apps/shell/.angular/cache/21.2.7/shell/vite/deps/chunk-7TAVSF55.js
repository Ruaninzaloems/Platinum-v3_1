import {
  MatTooltip,
  TooltipComponent
} from "./chunk-OF6RPEG2.js";
import {
  OverlayModule
} from "./chunk-LIQBW7CZ.js";
import {
  A11yModule
} from "./chunk-S2J6MTDC.js";
import {
  CdkScrollableModule
} from "./chunk-NSAAUXQM.js";
import {
  BidiModule
} from "./chunk-JPXPF4SI.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-WUO4HCAV.js";
import {
  ɵɵdefineInjector
} from "./chunk-OFYGUQ7M.js";

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
//# sourceMappingURL=chunk-7TAVSF55.js.map

import {
  MatRipple
} from "./chunk-XA3YIP7V.js";
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

// ../../node_modules/@angular/material/fesm2022/_ripple-module-chunk.mjs
var MatRippleModule = class _MatRippleModule {
  static ɵfac = function MatRippleModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatRippleModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatRippleModule,
    imports: [MatRipple],
    exports: [MatRipple, BidiModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [BidiModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleModule, [{
    type: NgModule,
    args: [{
      imports: [MatRipple],
      exports: [MatRipple, BidiModule]
    }]
  }], null, null);
})();

export {
  MatRippleModule
};
//# sourceMappingURL=chunk-QZMO4ISH.js.map

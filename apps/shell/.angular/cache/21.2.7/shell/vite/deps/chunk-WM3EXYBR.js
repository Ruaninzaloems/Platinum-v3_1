import {
  MatPseudoCheckbox
} from "./chunk-YAYKX4UG.js";
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

// ../../node_modules/@angular/material/fesm2022/_pseudo-checkbox-module-chunk.mjs
var MatPseudoCheckboxModule = class _MatPseudoCheckboxModule {
  static ɵfac = function MatPseudoCheckboxModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatPseudoCheckboxModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatPseudoCheckboxModule,
    imports: [MatPseudoCheckbox],
    exports: [MatPseudoCheckbox, BidiModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [BidiModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatPseudoCheckboxModule, [{
    type: NgModule,
    args: [{
      imports: [MatPseudoCheckbox],
      exports: [MatPseudoCheckbox, BidiModule]
    }]
  }], null, null);
})();

export {
  MatPseudoCheckboxModule
};
//# sourceMappingURL=chunk-WM3EXYBR.js.map

import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-EVLX5PI2.js";
import {
  ObserversModule
} from "./chunk-WV7NP6Q4.js";
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

// ../../node_modules/@angular/material/fesm2022/form-field.mjs
var MatFormFieldModule = class _MatFormFieldModule {
  static ɵfac = function MatFormFieldModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatFormFieldModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatFormFieldModule,
    imports: [ObserversModule, MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix],
    exports: [MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix, BidiModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [ObserversModule, MatFormField, BidiModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldModule, [{
    type: NgModule,
    args: [{
      imports: [ObserversModule, MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix],
      exports: [MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix, BidiModule]
    }]
  }], null, null);
})();

export {
  MatFormFieldModule
};
//# sourceMappingURL=chunk-IQ4QN2ZZ.js.map

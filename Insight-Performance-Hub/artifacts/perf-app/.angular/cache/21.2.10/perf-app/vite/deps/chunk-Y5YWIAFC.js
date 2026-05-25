import {
  ElementRef
} from "./chunk-PUOCQLCU.js";

// ../../node_modules/.pnpm/@angular+cdk@21.2.10_@angular+common@21.2.12_@angular+core@21.2.12_@angular+compiler@21_9b20a36d096738ce344b4400ca8301fb/node_modules/@angular/cdk/fesm2022/_element-chunk.mjs
function coerceNumberProperty(value, fallbackValue = 0) {
  if (_isNumberValue(value)) {
    return Number(value);
  }
  return arguments.length === 2 ? fallbackValue : 0;
}
function _isNumberValue(value) {
  return !isNaN(parseFloat(value)) && !isNaN(Number(value));
}
function coerceElement(elementOrRef) {
  return elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
}

export {
  coerceNumberProperty,
  coerceElement
};
//# sourceMappingURL=chunk-Y5YWIAFC.js.map

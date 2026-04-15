export const ALLOWED_COLORS = [
  '#000000',
  '#444444',
  '#003366',
  '#2e7d32',
  '#c62828',
  '#795548',
  '#1a237e',
  '#546e7a',
];

export const QUILL_TOOLBAR_MODULES = {
  toolbar: {
    container: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [3, 4, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      [{ color: ALLOWED_COLORS }],
      [{ size: ['small', false, 'large'] }],
      [{ script: 'sub' }, { script: 'super' }],
      ['insertTable', 'tableOps'],
      ['clean'],
    ],
    handlers: {
      insertTable() { },
      tableOps() { },
    },
  },
  table: true,
};

export const QUILL_FORMATS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'header',
  'list',
  'indent',
  'align',
  'color',
  'size',
  'script',
  'table',
];

export const QUILL_TOOLTIP_MAP: Record<string, string> = {
  'bold': 'Bold (Ctrl+B)',
  'italic': 'Italic (Ctrl+I)',
  'underline': 'Underline (Ctrl+U)',
  'strike': 'Strikethrough',
  'list[value="ordered"]': 'Numbered List',
  'list[value="bullet"]': 'Bullet List',
  'indent[value="-1"]': 'Decrease Indent',
  'indent[value="+1"]': 'Increase Indent',
  'clean': 'Clear Formatting',
  'script[value="sub"]': 'Subscript',
  'script[value="super"]': 'Superscript',
};

export function applyQuillTooltips(container: HTMLElement): void {
  const toolbar = container.querySelector('.ql-toolbar');
  if (!toolbar) return;

  for (const [selector, tooltip] of Object.entries(QUILL_TOOLTIP_MAP)) {
    let cssSelector: string;
    const bracketMatch = selector.match(/^(\w+)\[(\w+)="([^"]+)"\]$/);
    if (bracketMatch) {
      cssSelector = `.ql-${bracketMatch[1]}[value="${bracketMatch[3]}"]`;
    } else {
      cssSelector = `.ql-${selector}`;
    }

    const buttons = toolbar.querySelectorAll(cssSelector);
    buttons.forEach((btn: Element) => {
      btn.setAttribute('title', tooltip);
    });
  }

  const headerPicker = toolbar.querySelector('.ql-header .ql-picker-label');
  if (headerPicker) {
    headerPicker.setAttribute('title', 'Heading Level');
  }

  const colorPicker = toolbar.querySelector('.ql-color .ql-picker-label');
  if (colorPicker) {
    colorPicker.setAttribute('title', 'Font Colour');
  }

  const sizePicker = toolbar.querySelector('.ql-size .ql-picker-label');
  if (sizePicker) {
    sizePicker.setAttribute('title', 'Font Size');
  }

  const alignPicker = toolbar.querySelector('.ql-align .ql-picker-label');
  if (alignPicker) {
    alignPicker.setAttribute('title', 'Text Alignment');
  }
}

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!m) return null;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(parseInt(m[1], 10))}${toHex(parseInt(m[2], 10))}${toHex(parseInt(m[3], 10))}`.toLowerCase();
}

function normalizeColor(raw: any): string | null {
  if (!raw) return null;
  let hex = String(raw).trim().toLowerCase();
  if (hex.startsWith('rgb')) {
    const converted = rgbToHex(hex);
    if (!converted) return null;
    hex = converted;
  }
  if (!hex.startsWith('#')) return null;
  return ALLOWED_COLORS.includes(hex) ? hex : null;
}

export function registerQuillSizeWhitelist(quill: any): void {
  const Parchment = quill.constructor.import('parchment');
  const SizeClass = quill.constructor.import('attributors/class/size');
  if (SizeClass) {
    SizeClass.whitelist = ['small', 'large'];
    Parchment.register(SizeClass, true);
  }
}

export function registerQuillClipboardMatchers(quill: any): void {
  const Delta = quill.constructor.import('delta');

  quill.clipboard.addMatcher('TABLE', (node: HTMLElement, delta: any) => {
    const allowedBorder = node.getAttribute('data-border');
    if (allowedBorder && /^(none|thin|thick)$/i.test(allowedBorder)) {
      node.setAttribute('data-border', allowedBorder.toLowerCase());
    } else {
      node.removeAttribute('data-border');
    }
    const ALLOWED_TABLE_ATTRS = ['data-border'];
    Array.from(node.attributes).forEach(attr => {
      if (!ALLOWED_TABLE_ATTRS.includes(attr.name)) {
        node.removeAttribute(attr.name);
      }
    });
    node.querySelectorAll('td, th').forEach((cell: Element) => {
      const style = cell.getAttribute('style') || '';
      const cleanParts: string[] = [];
      const bwMatch = style.match(/border-width\s*:\s*([0-3])px/i);
      if (bwMatch) cleanParts.push(`border-width: ${bwMatch[1]}px`);
      const bsMatch = style.match(/border-style\s*:\s*(none|solid|dashed)/i);
      if (bsMatch) cleanParts.push(`border-style: ${bsMatch[1]}`);
      const bcMatch = style.match(/border-color\s*:\s*(#(?:000000|444444|003366|2e7d32|c62828|795548|1a237e|546e7a))/i);
      if (bcMatch) cleanParts.push(`border-color: ${bcMatch[1]}`);
      if (cleanParts.length > 0) {
        cell.setAttribute('style', cleanParts.join('; '));
      } else {
        cell.removeAttribute('style');
      }
      Array.from(cell.attributes).forEach(attr => {
        if (attr.name !== 'style' && attr.name !== 'data-row') {
          cell.removeAttribute(attr.name);
        }
      });
    });
    return delta;
  });

  quill.clipboard.addMatcher(Node.ELEMENT_NODE, (_node: HTMLElement, delta: any) => {
    const ops = delta.ops || [];
    const cleaned = ops.map((op: any) => {
      if (typeof op.insert !== 'string') {
        return { insert: '\n' };
      }
      if (!op.attributes) return op;
      const src = op.attributes as Record<string, any>;
      const attrs: Record<string, any> = {};
      if (src['bold']) attrs['bold'] = true;
      if (src['italic']) attrs['italic'] = true;
      if (src['underline']) attrs['underline'] = true;
      if (src['strike']) attrs['strike'] = true;
      if (src['script'] === 'sub' || src['script'] === 'super') attrs['script'] = src['script'];
      if (src['header'] === 3 || src['header'] === 4) attrs['header'] = src['header'];
      if (src['list'] === 'ordered' || src['list'] === 'bullet') attrs['list'] = src['list'];
      if (src['size'] === 'small' || src['size'] === 'large') attrs['size'] = src['size'];
      if (src['indent'] && typeof src['indent'] === 'number' && src['indent'] >= 1 && src['indent'] <= 3) {
        attrs['indent'] = src['indent'];
      }
      if (src['align'] === 'center' || src['align'] === 'right' || src['align'] === 'justify') {
        attrs['align'] = src['align'];
      }
      if (src['table']) {
        attrs['table'] = src['table'];
      }
      const normalizedColor = normalizeColor(src['color']);
      if (normalizedColor) {
        attrs['color'] = normalizedColor;
      }
      return Object.keys(attrs).length > 0
        ? { ...op, attributes: attrs }
        : { insert: op.insert };
    });
    return new Delta(cleaned);
  });
}

const TABLE_ICON_SVG = '<svg viewBox="0 0 18 18" width="18" height="18"><rect x="1" y="1" width="16" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="7" y1="1" x2="7" y2="17" stroke="currentColor" stroke-width="0.8"/><line x1="12" y1="1" x2="12" y2="17" stroke="currentColor" stroke-width="0.8"/><line x1="1" y1="7" x2="17" y2="7" stroke="currentColor" stroke-width="0.8"/><line x1="1" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="0.8"/></svg>';

const TABLE_OPS_ICON_SVG = '<svg viewBox="0 0 18 18" width="18" height="18"><rect x="1" y="1" width="16" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="9" y1="1" x2="9" y2="17" stroke="currentColor" stroke-width="0.8"/><line x1="1" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="0.8"/><circle cx="14" cy="14" r="3.5" fill="#2e7d32" stroke="white" stroke-width="0.8"/><line x1="14" y1="12" x2="14" y2="16" stroke="white" stroke-width="1.2"/><line x1="12" y1="14" x2="16" y2="14" stroke="white" stroke-width="1.2"/></svg>';

export function setupTableToolbar(quill: any, container: HTMLElement): void {
  const tableModule = quill.getModule('table');
  if (!tableModule) return;

  const toolbar = container.querySelector('.ql-toolbar');
  if (!toolbar) return;

  const insertBtn = toolbar.querySelector('.ql-insertTable') as HTMLElement;
  if (insertBtn) {
    insertBtn.innerHTML = TABLE_ICON_SVG;
    insertBtn.setAttribute('title', 'Insert Table');
    setupGridPicker(insertBtn, tableModule, quill.root);
  }

  const opsBtn = toolbar.querySelector('.ql-tableOps') as HTMLElement;
  if (opsBtn) {
    opsBtn.innerHTML = TABLE_OPS_ICON_SVG;
    opsBtn.setAttribute('title', 'Table Operations');
    setupOpsMenu(opsBtn, quill, tableModule);
  }
}

function setupGridPicker(btn: HTMLElement, tableModule: any, quillRoot: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.className = 'ql-table-picker-wrap';

  const label = document.createElement('div');
  label.className = 'ql-table-picker-label';
  label.textContent = 'Insert Table';
  wrap.appendChild(label);

  const grid = document.createElement('div');
  grid.className = 'ql-table-picker-grid';

  const sizeLabel = document.createElement('div');
  sizeLabel.className = 'ql-table-picker-size';
  sizeLabel.textContent = '';

  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 6; c++) {
      const cell = document.createElement('div');
      cell.className = 'ql-table-picker-cell';
      cell.dataset['row'] = String(r);
      cell.dataset['col'] = String(c);

      cell.addEventListener('mouseenter', () => {
        sizeLabel.textContent = `${r} × ${c}`;
        grid.querySelectorAll('.ql-table-picker-cell').forEach((el: Element) => {
          const cr = parseInt((el as HTMLElement).dataset['row']!, 10);
          const cc = parseInt((el as HTMLElement).dataset['col']!, 10);
          el.classList.toggle('highlight', cr <= r && cc <= c);
        });
      });

      cell.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tableModule.insertTable(r, c);
        wrap.style.display = 'none';
        applyDefaultTableBorders(quillRoot);
      });

      grid.appendChild(cell);
    }
  }

  wrap.appendChild(grid);
  wrap.appendChild(sizeLabel);

  btn.style.position = 'relative';
  btn.appendChild(wrap);

  btn.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.ql-table-picker-wrap')) return;
    e.stopPropagation();
    const isVisible = wrap.style.display === 'block';
    closeAllPickerMenus(btn);
    wrap.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.ql-insertTable')) {
      wrap.style.display = 'none';
    }
  });
}

function applyDefaultTableBorders(editorRoot: HTMLElement): void {
  setTimeout(() => {
    const tables = editorRoot.querySelectorAll('table');
    tables.forEach((tbl: Element) => {
      if (!tbl.getAttribute('data-border')) {
        tbl.setAttribute('data-border', 'thin');
      }
    });
  }, 50);
}

function setupOpsMenu(btn: HTMLElement, quill: any, tableModule: any): void {
  const menu = document.createElement('div');
  menu.className = 'ql-table-ops-menu';

  const ops = [
    { label: 'Add Row Above', action: () => tableModule.insertRowAbove() },
    { label: 'Add Row Below', action: () => tableModule.insertRowBelow() },
    { label: 'Add Column Left', action: () => tableModule.insertColumnLeft() },
    { label: 'Add Column Right', action: () => tableModule.insertColumnRight() },
    { divider: true },
    { label: 'Delete Row', action: () => tableModule.deleteRow(), danger: true },
    { label: 'Delete Column', action: () => tableModule.deleteColumn(), danger: true },
    { label: 'Delete Table', action: () => tableModule.deleteTable(), danger: true },
    { divider: true },
    { label: 'Border: None', action: () => setTableBorder(quill, 'none') },
    { label: 'Border: Thin', action: () => setTableBorder(quill, 'thin') },
    { label: 'Border: Thick', action: () => setTableBorder(quill, 'thick') },
  ];

  for (const op of ops) {
    if ((op as any).divider) {
      const hr = document.createElement('div');
      hr.className = 'ql-table-ops-divider';
      menu.appendChild(hr);
      continue;
    }
    const item = document.createElement('div');
    item.className = 'ql-table-ops-item' + ((op as any).danger ? ' danger' : '');
    item.textContent = op.label!;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      (op as any).action();
      menu.style.display = 'none';
    });
    menu.appendChild(item);
  }

  btn.style.position = 'relative';
  btn.appendChild(menu);

  btn.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.ql-table-ops-menu')) return;
    e.stopPropagation();
    const isVisible = menu.style.display === 'block';
    closeAllPickerMenus(btn);
    menu.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.ql-tableOps')) {
      menu.style.display = 'none';
    }
  });
}

function setTableBorder(quill: any, borderStyle: string): void {
  const selection = quill.getSelection();
  if (!selection) return;
  const [leaf] = quill.getLeaf(selection.index);
  if (!leaf) return;
  let node = leaf.domNode as HTMLElement;
  while (node && node.tagName !== 'TABLE') {
    node = node.parentElement!;
    if (!node || node.classList?.contains('ql-editor')) break;
  }
  if (node && node.tagName === 'TABLE') {
    node.setAttribute('data-border', borderStyle);
  }
}

export function restoreTableBorders(quill: any, sourceHtml: string): void {
  if (!sourceHtml) return;
  const borderRegex = /<table[^>]*data-border="(none|thin|thick)"[^>]*>/gi;
  const borders: string[] = [];
  let match;
  while ((match = borderRegex.exec(sourceHtml)) !== null) {
    borders.push(match[1]);
  }
  if (borders.length === 0) return;
  setTimeout(() => {
    const tables = quill.root.querySelectorAll('table');
    tables.forEach((tbl: HTMLElement, idx: number) => {
      if (idx < borders.length && !tbl.getAttribute('data-border')) {
        tbl.setAttribute('data-border', borders[idx]);
      }
    });
  }, 150);
}

function closeAllPickerMenus(except: HTMLElement): void {
  const toolbar = except.closest('.ql-toolbar');
  if (!toolbar) return;
  toolbar.querySelectorAll('.ql-table-picker-wrap, .ql-table-ops-menu').forEach((el: Element) => {
    if (!except.contains(el)) {
      (el as HTMLElement).style.display = 'none';
    }
  });
}

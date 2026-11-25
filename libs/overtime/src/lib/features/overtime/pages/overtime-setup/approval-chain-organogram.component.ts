import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PositionApprovalService } from '../../../../core/services/position-approval.service';
import { OrgChartData, OrgChartNode } from '../../../../core/models/position-approval.model';

// ── Local types ───────────────────────────────────────────────────────────────
interface TreeNode {
  node: OrgChartNode;
  children: TreeNode[];
  leaves: OrgChartNode[];
}

interface FlatRow {
  node: OrgChartNode;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
}

interface GapRow {
  node: OrgChartNode;
  parentDesc: string;
}

@Component({
  selector: 'app-approval-chain-organogram',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="chain-shell">

      @if (loading()) {
        <div class="state-center">
          <div class="spinner"></div>
          <span>Loading approval chain…</span>
        </div>
      }

      @else if (error()) {
        <div class="state-center state-error">
          <span class="state-icon">✕</span>
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" (click)="load()">Retry</button>
        </div>
      }

      @else {
        <!-- ── Summary bar ─────────────────────────────────────────────── -->
        <div class="summary-bar">
          <div class="summary-stats">
            <div class="stat">
              <strong>{{ pacCount() }}</strong>
              <span>configured position{{ pacCount() !== 1 ? 's' : '' }}</span>
            </div>
            <div class="stat">
              <strong>{{ leafCount() }}</strong>
              <span>employee position{{ leafCount() !== 1 ? 's' : '' }}</span>
            </div>
            @if (gapCount() > 0) {
              <div class="stat">
                <span class="gap-pill">⚠ {{ gapCount() }} missing recommender{{ gapCount() !== 1 ? 's' : '' }}</span>
              </div>
            } @else {
              <div class="stat">
                <span class="ok-pill">✓ All chains complete</span>
              </div>
            }
          </div>

          <!-- View toggle pill -->
          <div class="view-pill" role="tablist" aria-label="Approval chain views">
            <button role="tab" [class.active]="view() === 'gaps'"  (click)="view.set('gaps')"
                    [attr.aria-selected]="view() === 'gaps'">
              Gaps{{ gapCount() > 0 ? ' (' + gapCount() + ')' : '' }}
            </button>
            <button role="tab" [class.active]="view() === 'chain'" (click)="view.set('chain')"
                    [attr.aria-selected]="view() === 'chain'">
              Chain Lookup
            </button>
            <button role="tab" [class.active]="view() === 'tree'"  (click)="view.set('tree')"
                    [attr.aria-selected]="view() === 'tree'">
              Tree
            </button>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- GAPS VIEW                                                       -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        @if (view() === 'gaps') {
          @if (gapCount() === 0) {
            <div class="state-center">
              <span class="state-icon">✓</span>
              <p class="ok-text">All {{ pacCount() }} configured positions have a recommender in their chain.</p>
            </div>
          } @else {
            <div class="gaps-toolbar">
              <input class="search-input" type="text"
                     placeholder="Filter by employee, position description, or ID…"
                     [ngModel]="gapSearch()"
                     (ngModelChange)="gapSearch.set($event)"
                     aria-label="Filter gaps" />
              <span class="result-count">
                {{ gapsTable().length }} of {{ gapCount() }} shown
              </span>
            </div>

            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Position ID</th>
                    <th>Missing</th>
                    <th>Nearest chain node</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of gapsTable(); track row.node.positionId) {
                    <tr class="gap-row">
                      <td>
                        @if (row.node.employeeName) {
                          <span class="occ-pill occ-filled">{{ row.node.employeeName }}</span>
                        } @else {
                          <span class="occ-pill occ-vacant">Vacant</span>
                        }
                      </td>
                      <td>{{ row.node.positionDescription }}</td>
                      <td class="mono">{{ row.node.positionId }}</td>
                      <td><span class="missing-badge">Recommender</span></td>
                      <td class="muted">{{ row.parentDesc }}</td>
                    </tr>
                  }
                  @if (gapsTable().length === 0) {
                    <tr>
                      <td colspan="5" class="no-match-cell">No gaps match "{{ gapSearch() }}".</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- CHAIN LOOKUP VIEW                                               -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        @else if (view() === 'chain') {
          <div class="chain-lookup-shell">
            <p class="lookup-hint">
              Type an employee name, position description, or ID to see their full approval chain.
            </p>

            <!-- Search + dropdown -->
            <div class="lookup-search-wrap">
              @if (chainSelected()) {
                <div class="selected-pill">
                  <span>{{ chainSelected()!.positionDescription }}</span>
                  @if (chainSelected()!.employeeName) {
                    <span class="sel-emp"> — {{ chainSelected()!.employeeName }}</span>
                  }
                  <button class="clear-btn" (click)="clearChain()" aria-label="Clear selection">✕</button>
                </div>
              } @else {
                <input class="search-input search-input-lg" type="text"
                       placeholder="Search employee or position…"
                       [ngModel]="chainSearch()"
                       (ngModelChange)="chainSearch.set($event)"
                       autocomplete="off"
                       aria-label="Search for a position" />
                @if (chainDropdown().length > 0) {
                  <ul class="dropdown-list" role="listbox">
                    @for (item of chainDropdown(); track item.positionId) {
                      <li class="dropdown-item" role="option"
                          [class.drop-gap]="item.hasRecommenderGap"
                          (mousedown)="selectChain(item)">
                        <span class="drop-desc">{{ item.positionDescription }}</span>
                        <span class="drop-meta">
                          {{ item.positionId }}
                          @if (item.employeeName) { · {{ item.employeeName }} }
                          @if (!item.isPacNode) { · Employee position }
                          @if (item.hasRecommenderGap) { · ⚠ Gap }
                        </span>
                      </li>
                    }
                  </ul>
                } @else if (chainSearch().length > 0) {
                  <div class="dropdown-empty">No positions match "{{ chainSearch() }}".</div>
                }
              }
            </div>

            <!-- Chain path display -->
            @if (chainSelected() && chainPath().length > 0) {
              <div class="chain-path">
                <div class="chain-status"
                     [class.chain-ok]="chainHasRecommender()"
                     [class.chain-bad]="!chainHasRecommender()">
                  @if (chainHasRecommender()) {
                    ✓ Chain is complete — a recommender is configured above this position.
                  } @else {
                    ⚠ Chain is incomplete — no recommender found anywhere in the approval chain.
                  }
                </div>

                @for (step of chainPath(); track step.positionId; let i = $index) {
                  <div class="chain-step"
                       [class.step-leaf]="!step.isPacNode"
                       [class.step-rec]="step.isPacNode && step.isRecommender && !step.isApprover"
                       [class.step-app]="step.isPacNode && !step.isRecommender && step.isApprover"
                       [class.step-both]="step.isPacNode && step.isRecommender && step.isApprover"
                       [class.step-none]="step.isPacNode && !step.isRecommender && !step.isApprover && !step.isExcessApprover"
                       [class.step-gap]="step.hasRecommenderGap">
                    <div class="step-num">{{ i + 1 }}</div>
                    <div class="step-body">
                      <div class="step-top">
                        <span class="step-desc">{{ step.positionDescription }}</span>
                        <span class="step-id mono">{{ step.positionId }}</span>
                      </div>
                      <div class="step-emp">
                        @if (step.employeeName) {
                          <span class="occ-pill occ-filled">{{ step.employeeName }}</span>
                        } @else {
                          <span class="occ-pill occ-vacant">Vacant</span>
                        }
                      </div>
                      <div class="step-roles">
                        @if (!step.isPacNode) {
                          <span class="role-tag role-leaf">Employee position</span>
                        } @else {
                          @if (step.isRecommender) { <span class="role-tag role-rec">Recommender ✓</span> }
                          @if (step.isApprover)    { <span class="role-tag role-app">Approver ✓</span> }
                          @if (step.isExcessApprover) { <span class="role-tag role-exc">Excess Approver</span> }
                          @if (!step.isRecommender && !step.isApprover && !step.isExcessApprover) {
                            <span class="role-tag role-none">No role configured</span>
                          }
                        }
                      </div>
                    </div>
                    @if (i < chainPath().length - 1) {
                      <div class="step-arrow">↓</div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- TREE VIEW                                                        -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        @else {
          <div class="tree-toolbar">
            <div class="tree-toggle-group">
              <button class="btn btn-sm"
                      [class.btn-primary]="treeGapsOnly()"
                      [class.btn-secondary]="!treeGapsOnly()"
                      (click)="setTreeGapsOnly(true)">Gaps only</button>
              <button class="btn btn-sm"
                      [class.btn-primary]="!treeGapsOnly()"
                      [class.btn-secondary]="treeGapsOnly()"
                      (click)="setTreeGapsOnly(false)">Full tree</button>
            </div>
            @if (!treeGapsOnly()) {
              <input class="search-input" type="text"
                     placeholder="Filter by description or ID…"
                     [ngModel]="treeSearch()"
                     (ngModelChange)="treeSearch.set($event)"
                     aria-label="Filter tree" />
            }
            <button class="btn btn-secondary btn-sm" (click)="expandAll()">Expand all</button>
            <button class="btn btn-secondary btn-sm" (click)="collapseAll()">Collapse all</button>
          </div>

          <!-- Legend -->
          <div class="tree-legend">
            <span class="leg-item"><span class="leg-swatch leg-rec"></span>Recommender</span>
            <span class="leg-item"><span class="leg-swatch leg-app"></span>Approver</span>
            <span class="leg-item"><span class="leg-swatch leg-both"></span>Both</span>
            <span class="leg-item"><span class="leg-swatch leg-gap"></span>Missing recommender</span>
            <span class="leg-item"><span class="leg-swatch leg-leaf-gap"></span>Employee — gap</span>
          </div>

          <!-- Flat indented tree -->
          <div class="tree-scroll">
            @if (flatRows().length === 0) {
              <p class="no-match">
                @if (treeGapsOnly()) {
                  No gaps found — all chains have a recommender configured.
                } @else {
                  @if (treeSearch()) { No positions match "{{ treeSearch() }}". }
                  @else { No reporting relationships have been configured yet. }
                }
              </p>
            } @else {
              @for (row of flatRows(); track row.node.positionId) {
                <div class="tree-row"
                     [class.row-pac]="row.node.isPacNode"
                     [class.row-leaf]="!row.node.isPacNode"
                     [class.row-rec]="row.node.isPacNode && row.node.isRecommender && !row.node.isApprover"
                     [class.row-app]="row.node.isPacNode && !row.node.isRecommender && row.node.isApprover"
                     [class.row-both]="row.node.isPacNode && row.node.isRecommender && row.node.isApprover"
                     [class.row-none]="row.node.isPacNode && !row.node.isRecommender && !row.node.isApprover"
                     [class.row-gap]="row.node.hasRecommenderGap"
                     [style.padding-left.px]="row.depth * 28 + 14"
                     (click)="row.hasChildren && toggleCollapse(row.node.positionId)"
                     [style.cursor]="row.hasChildren ? 'pointer' : 'default'">

                  <span class="row-caret">
                    @if (row.hasChildren) {
                      {{ row.isCollapsed ? '▶' : '▼' }}
                    }
                  </span>

                  <div class="row-main">
                    <span class="row-desc">{{ row.node.positionDescription }}</span>
                    <span class="row-id mono">{{ row.node.positionId }}</span>
                    @if (row.node.employeeName) {
                      <span class="occ-pill occ-filled row-occ">{{ row.node.employeeName }}</span>
                    } @else {
                      <span class="occ-pill occ-vacant row-occ">Vacant</span>
                    }
                  </div>

                  @if (row.node.isPacNode) {
                    <div class="row-badges">
                      @if (row.node.isRecommender)   { <span class="badge b-rec">REC</span> }
                      @if (row.node.isApprover)       { <span class="badge b-app">APP</span> }
                      @if (row.node.isExcessApprover) { <span class="badge b-exc">EXC</span> }
                    </div>
                  }

                  @if (row.node.hasRecommenderGap) {
                    <span class="row-gap-flag" title="No recommender in chain">⚠</span>
                  }
                </div>
              }
            }
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .chain-shell { padding: 0 0 32px; }

    /* ── State placeholders ──────────────────────────────────────────────── */
    .state-center {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 64px 24px;
      color: var(--color-text-muted, #6b7280); text-align: center;
    }
    .state-error { color: var(--color-danger, #dc2626); }
    .state-icon  { font-size: 32px; }
    .ok-text     { font-weight: 600; color: #15803d; margin: 0; }

    .spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #2563eb);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Summary bar ─────────────────────────────────────────────────────── */
    .summary-bar {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 0 16px; flex-wrap: wrap;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      margin-bottom: 20px;
    }
    .summary-stats { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-muted, #6b7280); }
    .stat strong { font-size: 20px; font-weight: 700; color: var(--color-text, #111827); }

    .gap-pill {
      font-size: 12px; font-weight: 600; color: #b45309;
      background: #fef3c7; padding: 3px 10px; border-radius: 12px;
      border: 1px solid #fde68a;
    }
    .ok-pill {
      font-size: 12px; font-weight: 600; color: #15803d;
      background: #dcfce7; padding: 3px 10px; border-radius: 12px;
      border: 1px solid #bbf7d0;
    }

    /* ── View pill toggle ────────────────────────────────────────────────── */
    .view-pill {
      margin-left: auto; display: flex;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 8px; overflow: hidden;
    }
    .view-pill button {
      font-size: 13px; font-weight: 500; padding: 6px 16px;
      background: var(--color-bg-surface, #fff); border: none; cursor: pointer;
      color: var(--color-text-muted, #6b7280);
      border-right: 1px solid var(--color-border, #e5e7eb);
    }
    .view-pill button:last-child { border-right: none; }
    .view-pill button.active {
      background: var(--color-primary, #2563eb); color: #fff;
    }
    .view-pill button:not(.active):hover { background: var(--color-bg-hover, #f3f4f6); }

    /* ── Shared inputs / buttons ─────────────────────────────────────────── */
    .btn { cursor: pointer; border: none; border-radius: 6px; font-weight: 500; }
    .btn-sm { font-size: 13px; padding: 6px 12px; }
    .btn-primary   { background: var(--color-primary, #2563eb); color: #fff; }
    .btn-primary:hover   { background: #1d4ed8; }
    .btn-secondary { background: var(--color-bg-hover, #f3f4f6); color: var(--color-text, #111827); border: 1px solid var(--color-border, #e5e7eb); }
    .btn-secondary:hover { background: #e5e7eb; }

    .search-input {
      font-size: 13px; padding: 7px 11px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 6px; outline: none;
      background: var(--color-bg-surface, #fff);
      width: 260px;
    }
    .search-input:focus { border-color: var(--color-primary, #2563eb); }
    .search-input-lg { width: 340px; }

    .muted { color: var(--color-text-muted, #9ca3af); font-style: italic; font-size: 12px; }
    .mono  { font-family: monospace; font-size: 11px; }

    /* ── GAPS VIEW ───────────────────────────────────────────────────────── */
    .gaps-toolbar {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 12px;
    }
    .result-count { font-size: 12px; color: var(--color-text-muted, #9ca3af); }

    .table-scroll { overflow-x: auto; }

    .data-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .data-table th {
      text-align: left; padding: 8px 12px;
      background: var(--color-bg-hover, #f9fafb);
      border-bottom: 2px solid var(--color-border, #e5e7eb);
      font-weight: 600; font-size: 12px; color: var(--color-text-muted, #6b7280);
      white-space: nowrap;
    }
    .data-table td { padding: 9px 12px; border-bottom: 1px solid var(--color-border, #f3f4f6); vertical-align: middle; }
    .gap-row:hover td { background: #fffbeb; }

    .missing-badge {
      font-size: 11px; font-weight: 600; color: #b45309;
      background: #fef3c7; padding: 2px 8px; border-radius: 10px;
      border: 1px solid #fde68a;
    }
    .no-match-cell { text-align: center; color: var(--color-text-muted, #9ca3af); padding: 32px; }

    /* ── CHAIN LOOKUP VIEW ───────────────────────────────────────────────── */
    .chain-lookup-shell { padding: 4px 0; }
    .lookup-hint { font-size: 13px; color: var(--color-text-muted, #6b7280); margin: 0 0 12px; }

    .lookup-search-wrap { position: relative; margin-bottom: 24px; }

    .selected-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 8px; padding: 8px 12px;
      font-size: 13px; font-weight: 500; color: #1e40af;
    }
    .sel-emp { font-weight: 400; color: #3b82f6; }
    .clear-btn {
      background: none; border: none; cursor: pointer;
      color: #6b7280; font-size: 14px; padding: 0 2px; line-height: 1;
    }
    .clear-btn:hover { color: #374151; }

    .dropdown-list {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
      background: var(--color-bg-surface, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
      list-style: none; margin: 4px 0 0; padding: 4px 0;
      max-height: 320px; overflow-y: auto;
    }
    .dropdown-item {
      padding: 9px 14px; cursor: pointer;
      display: flex; flex-direction: column; gap: 2px;
    }
    .dropdown-item:hover { background: var(--color-bg-hover, #f3f4f6); }
    .dropdown-item.drop-gap { border-left: 3px solid #f59e0b; }
    .drop-desc { font-size: 13px; font-weight: 500; color: var(--color-text, #111827); }
    .drop-meta { font-size: 11px; color: var(--color-text-muted, #9ca3af); }

    .dropdown-empty {
      padding: 12px 14px; font-size: 13px;
      color: var(--color-text-muted, #9ca3af);
    }

    .chain-path { display: flex; flex-direction: column; gap: 0; max-width: 600px; }

    .chain-status {
      font-size: 13px; font-weight: 600; padding: 8px 14px;
      border-radius: 8px; margin-bottom: 16px;
    }
    .chain-ok  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .chain-bad { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    .chain-step {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 12px 14px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 8px; margin-bottom: 2px;
      background: var(--color-bg-surface, #fff);
      border-left: 4px solid #9ca3af;
      position: relative;
    }
    .chain-step.step-leaf { border-left-color: #9ca3af; background: #f9fafb; }
    .chain-step.step-rec  { border-left-color: #16a34a; }
    .chain-step.step-app  { border-left-color: #2563eb; }
    .chain-step.step-both { border-left-color: #7c3aed; }
    .chain-step.step-none { border-left-color: #d1d5db; }
    .chain-step.step-gap  { background: #fffbeb; border-left-color: #f59e0b; }

    .step-num {
      flex-shrink: 0; width: 26px; height: 26px;
      border-radius: 50%; background: var(--color-bg-hover, #f3f4f6);
      border: 1px solid var(--color-border, #e5e7eb);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--color-text-muted, #6b7280);
    }
    .step-body { flex: 1; }
    .step-top  { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
    .step-desc { font-size: 13px; font-weight: 600; color: var(--color-text, #111827); }
    .step-id   { font-size: 11px; color: var(--color-text-muted, #9ca3af); }
    .step-emp  { font-size: 12px; color: var(--color-text-muted, #6b7280); margin-bottom: 4px; }
    .step-roles { display: flex; gap: 6px; flex-wrap: wrap; }

    .role-tag {
      font-size: 11px; font-weight: 600; padding: 2px 8px;
      border-radius: 10px; white-space: nowrap;
    }
    .role-rec  { background: #dcfce7; color: #15803d; }
    .role-app  { background: #dbeafe; color: #1d4ed8; }
    .role-exc  { background: #ffedd5; color: #c2410c; }
    .role-none { background: #f3f4f6; color: #6b7280; }
    .role-leaf { background: #f3f4f6; color: #6b7280; }

    .step-arrow {
      font-size: 18px; color: var(--color-text-muted, #d1d5db);
      position: absolute; bottom: -12px; left: 24px; z-index: 1;
    }

    /* ── TREE VIEW ───────────────────────────────────────────────────────── */
    .tree-toolbar {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0 12px; flex-wrap: wrap;
    }
    .tree-toggle-group { display: flex; }
    .tree-toggle-group .btn-sm:first-child { border-radius: 6px 0 0 6px; }
    .tree-toggle-group .btn-sm:last-child  { border-radius: 0 6px 6px 0; margin-left: -1px; }

    .tree-legend {
      display: flex; flex-wrap: wrap; gap: 14px;
      padding: 8px 0 12px;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      margin-bottom: 8px;
    }
    .leg-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--color-text-muted, #6b7280); }
    .leg-swatch {
      width: 4px; height: 16px; border-radius: 2px; flex-shrink: 0;
    }
    .leg-rec  { background: #16a34a; }
    .leg-app  { background: #2563eb; }
    .leg-both { background: #7c3aed; }
    .leg-gap  { background: #f59e0b; }
    .leg-leaf-gap { background: #fca5a5; }

    .tree-scroll {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 600px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 8px;
    }

    .no-match { padding: 32px; text-align: center; color: var(--color-text-muted, #9ca3af); font-size: 13px; margin: 0; }

    .tree-row {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 14px 7px 14px;
      border-bottom: 1px solid var(--color-border, #f3f4f6);
      border-left: 4px solid transparent;
      min-height: 36px;
      background: var(--color-bg-surface, #fff);
      user-select: none;
    }
    .tree-row:last-child { border-bottom: none; }

    /* PAC row role colors */
    .tree-row.row-pac  { background: var(--color-bg-surface, #fff); }
    .tree-row.row-leaf { background: #fafafa; border-left-color: transparent !important; }
    .tree-row.row-rec  { border-left-color: #16a34a; }
    .tree-row.row-app  { border-left-color: #2563eb; }
    .tree-row.row-both { border-left-color: #7c3aed; }
    .tree-row.row-none { border-left-color: #d1d5db; }
    .tree-row.row-gap  { background: #fffbeb; border-left-color: #f59e0b !important; }
    .tree-row.row-leaf.row-gap { background: #fff5f5; border-left-color: #fca5a5 !important; }
    .tree-row:hover { background: var(--color-bg-hover, #f9fafb); }

    .row-caret { width: 14px; text-align: center; font-size: 10px; flex-shrink: 0; color: var(--color-text-muted, #9ca3af); }
    .row-main  { flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .row-desc  { font-size: 13px; color: var(--color-text, #111827); font-weight: 500; }
    .row-leaf .row-desc { font-weight: 400; color: #374151; font-size: 12px; }
    .row-id    { font-size: 10px; color: var(--color-text-muted, #9ca3af); }
    .row-occ   { flex-shrink: 0; }
    .row-badges { display: flex; gap: 3px; flex-shrink: 0; }
    .row-gap-flag { font-size: 13px; flex-shrink: 0; }

    /* ── Filled / Vacant occupancy pills (shared across all three views) ─── */
    .occ-pill {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      padding: 1px 7px; border-radius: 10px;
      white-space: nowrap; line-height: 1.6;
    }
    .occ-filled {
      background: #d1fae5; color: #065f46;
      border: 1px solid #6ee7b7;
    }
    .occ-vacant {
      background: transparent; color: #92400e;
      border: 1px solid #fde68a;
    }
    /* Slightly smaller in table cells so they don't balloon row height */
    .data-table .occ-pill { font-size: 11px; padding: 1px 6px; }
    /* In chain-step the pill sits inside .step-emp, reduce top margin */
    .step-emp { margin-bottom: 4px; }

    .badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; letter-spacing: .5px; }
    .b-rec  { background: #dcfce7; color: #15803d; }
    .b-app  { background: #dbeafe; color: #1d4ed8; }
    .b-exc  { background: #ffedd5; color: #c2410c; }
  `],
})
export class ApprovalChainOrganogramComponent implements OnInit {
  private svc = inject(PositionApprovalService);

  // ── Core state ──────────────────────────────────────────────────────────────
  nodes   = signal<OrgChartNode[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  // ── View selection ───────────────────────────────────────────────────────────
  view = signal<'gaps' | 'chain' | 'tree'>('gaps');

  // ── Summary counts (derived from full flat list) ─────────────────────────────
  pacCount  = computed(() => this.nodes().filter(n => n.isPacNode).length);
  leafCount = computed(() => this.nodes().filter(n => !n.isPacNode).length);
  gapCount  = computed(() => this.nodes().filter(n => n.hasRecommenderGap).length);

  // ── Node-by-ID map (for chain traversal and gap parent lookup) ───────────────
  private nodeById = computed(() =>
    new Map(this.nodes().map(n => [n.positionId, n]))
  );

  // ── Gaps view ────────────────────────────────────────────────────────────────
  gapSearch = signal('');

  gapsTable = computed<GapRow[]>(() => {
    const q   = this.gapSearch().trim().toLowerCase();
    const map = this.nodeById();

    return this.nodes()
      .filter(n => n.hasRecommenderGap)
      .filter(n => {
        if (!q) return true;
        return (
          n.positionDescription.toLowerCase().includes(q) ||
          n.positionId.toLowerCase().includes(q) ||
          (n.employeeName ?? '').toLowerCase().includes(q)
        );
      })
      .map(n => {
        const parentNode = n.parentPositionId ? map.get(n.parentPositionId) : undefined;
        const parentDesc = parentNode
          ? parentNode.positionDescription
          : (n.parentPositionId ?? 'Root');
        return { node: n, parentDesc };
      });
  });

  // ── Chain lookup view ────────────────────────────────────────────────────────
  chainSearch   = signal('');
  chainSelected = signal<OrgChartNode | null>(null);

  chainDropdown = computed<OrgChartNode[]>(() => {
    if (this.chainSelected()) return [];
    const q = this.chainSearch().trim().toLowerCase();
    if (!q) return [];
    return this.nodes()
      .filter(n =>
        n.positionDescription.toLowerCase().includes(q) ||
        n.positionId.toLowerCase().includes(q) ||
        (n.employeeName ?? '').toLowerCase().includes(q)
      )
      .slice(0, 15);
  });

  chainPath = computed<OrgChartNode[]>(() => {
    const sel = this.chainSelected();
    if (!sel) return [];
    const map = this.nodeById();
    const path: OrgChartNode[] = [sel];
    const visited = new Set<string>([sel.positionId]);
    let cur = sel.parentPositionId;
    while (cur) {
      const parent = map.get(cur);
      if (!parent || visited.has(parent.positionId)) break;
      visited.add(parent.positionId);
      path.push(parent);
      cur = parent.parentPositionId;
    }
    return path;
  });

  /**
   * Use the API's authoritative gap flag on the selected node rather than
   * re-scanning the chain path. Re-scanning is wrong because the selected
   * node itself may be a recommender, which would incorrectly mark chains
   * such as "Recommender PAC → gap above it" as complete.
   */
  chainHasRecommender = computed(() => {
    const sel = this.chainSelected();
    // hasRecommenderGap === true  →  no recommender exists in the chain above (incomplete)
    // hasRecommenderGap === false →  a recommender is configured somewhere above (complete)
    return sel !== null && !sel.hasRecommenderGap;
  });

  selectChain(node: OrgChartNode): void {
    this.chainSelected.set(node);
    this.chainSearch.set('');
  }

  clearChain(): void {
    this.chainSelected.set(null);
    this.chainSearch.set('');
  }

  // ── Tree view ────────────────────────────────────────────────────────────────
  treeGapsOnly = signal(true);
  treeSearch   = signal('');
  collapsed    = signal(new Set<string>());

  /** Full hierarchical structure (roots only, children nested). */
  private treeRoots = computed<TreeNode[]>(() => this.buildTree(this.nodes()));

  /** After applying gapsOnly filter and text search. */
  private filteredRoots = computed<TreeNode[]>(() => {
    let roots = this.treeRoots();
    if (this.treeGapsOnly()) {
      roots = roots
        .map(r => this.pruneGaps(r))
        .filter((r): r is TreeNode => r !== null);
    }
    const q = this.treeSearch().trim().toLowerCase();
    if (q) {
      roots = roots
        .map(r => this.pruneSearch(r, q))
        .filter((r): r is TreeNode => r !== null);
    }
    return roots;
  });

  /** Flat, depth-annotated rows ready for rendering. */
  flatRows = computed<FlatRow[]>(() => {
    const collapsed = this.collapsed();
    const rows: FlatRow[] = [];
    const walk = (node: TreeNode, depth: number) => {
      const hasChildren = node.children.length > 0 || node.leaves.length > 0;
      const isCollapsed = hasChildren && collapsed.has(node.node.positionId);
      rows.push({ node: node.node, depth, hasChildren, isCollapsed });
      if (!isCollapsed) {
        for (const child of node.children) walk(child, depth + 1);
        for (const leaf of node.leaves) {
          rows.push({ node: leaf, depth: depth + 1, hasChildren: false, isCollapsed: false });
        }
      }
    };
    for (const root of this.filteredRoots()) walk(root, 0);
    return rows;
  });

  toggleCollapse(positionId: string): void {
    this.collapsed.update(s => {
      const next = new Set(s);
      if (next.has(positionId)) next.delete(positionId);
      else next.add(positionId);
      return next;
    });
  }

  expandAll(): void  { this.collapsed.set(new Set()); }
  collapseAll(): void {
    const allPacIds = new Set(this.nodes().filter(n => n.isPacNode).map(n => n.positionId));
    this.collapsed.set(allPacIds);
  }

  setTreeGapsOnly(v: boolean): void {
    this.treeGapsOnly.set(v);
    this.treeSearch.set('');
    this.collapsed.set(new Set());
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Always fetch the full dataset; all filtering is client-side.
    this.svc.organogram(false).subscribe({
      next: (data: OrgChartData) => {
        this.nodes.set(data.nodes ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load the approval chain. Please try again.');
        this.loading.set(false);
      },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────
  private buildTree(allNodes: OrgChartNode[]): TreeNode[] {
    const pacNodes  = allNodes.filter(n => n.isPacNode);
    const leafNodes = allNodes.filter(n => !n.isPacNode);

    const build = (pac: OrgChartNode): TreeNode => ({
      node: pac,
      children: pacNodes
        .filter(n => n.parentPositionId === pac.positionId)
        .map(build),
      leaves: leafNodes.filter(n => n.parentPositionId === pac.positionId),
    });

    return pacNodes.filter(n => !n.parentPositionId).map(build);
  }

  /** Keep only subtrees that contain at least one gap node. */
  private pruneGaps(node: TreeNode): TreeNode | null {
    const keptChildren = node.children
      .map(c => this.pruneGaps(c))
      .filter((c): c is TreeNode => c !== null);
    const keptLeaves = node.leaves.filter(l => l.hasRecommenderGap);

    if (node.node.hasRecommenderGap || keptChildren.length > 0 || keptLeaves.length > 0) {
      return { node: node.node, children: keptChildren, leaves: keptLeaves };
    }
    return null;
  }

  /** Keep only subtrees that match the search query. */
  private pruneSearch(node: TreeNode, q: string): TreeNode | null {
    const matches = (s: string) => s.toLowerCase().includes(q);
    const keptChildren = node.children
      .map(c => this.pruneSearch(c, q))
      .filter((c): c is TreeNode => c !== null);
    const keptLeaves = node.leaves.filter(
      l => matches(l.positionDescription) || matches(l.positionId) ||
           matches(l.employeeName ?? '')
    );
    const selfMatches = matches(node.node.positionDescription) ||
                        matches(node.node.positionId) ||
                        matches(node.node.employeeName ?? '');
    if (selfMatches || keptChildren.length > 0 || keptLeaves.length > 0) {
      return { node: node.node, children: keptChildren, leaves: keptLeaves };
    }
    return null;
  }
}

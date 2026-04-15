import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-register-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button mat-icon-button routerLink="/verification/register"><mat-icon>arrow_back</mat-icon></button>
      <div style="flex:1">
        <h1 style="font-size:20px;font-weight:700;color:#1e293b;margin:0">{{register?.registerName || 'Loading...'}}</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">
          {{register?.registerType}} · {{register?.totalItems || 0}} assets
          @if (register?.isHistory) { <span class="history-tag">History</span> }
        </p>
      </div>
      @if (!register?.isHistory) {
        <button mat-stroked-button (click)="moveToHistory()" style="color:#d97706;border-color:#d97706">
          <mat-icon>archive</mat-icon> Move to History
        </button>
      }
    </div>

    <div class="tab-bar">
      <button class="tab" [class.active]="activeTab === 'overview'" (click)="switchTab('overview')">
        <mat-icon>list_alt</mat-icon> Overview
      </button>
      <button class="tab" [class.active]="activeTab === 'manage'" (click)="switchTab('manage')" [class.disabled-tab]="register?.isHistory">
        <mat-icon>edit_note</mat-icon> Manage Verification
      </button>
      <button class="tab" [class.active]="activeTab === 'approve'" (click)="switchTab('approve')" [class.disabled-tab]="register?.isHistory">
        <mat-icon>check_circle</mat-icon> Approval
      </button>
      <button class="tab" [class.active]="activeTab === 'team'" (click)="switchTab('team')">
        <mat-icon>group</mat-icon> Team ({{registerTeamMembers.length}})
      </button>
      <button class="tab" [class.active]="activeTab === 'map'" (click)="switchTab('map')">
        <mat-icon>map</mat-icon> Map
      </button>
    </div>

    @if (loading) {
      <div style="text-align:center;padding:60px"><mat-spinner diameter="32"></mat-spinner></div>
    } @else {
      @if (activeTab === 'overview') {
        <div class="tab-content">
          <div class="search-row">
            <mat-form-field appearance="outline" style="width:300px">
              <mat-label>Search items</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadItems()">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="exportCsv()" style="height:40px;white-space:nowrap" [disabled]="exportingCsv">
              <mat-icon>download</mat-icon> Export CSV
            </button>
            <div class="col-group-toggles">
              <button class="grp-btn" [class.active]="showGroup['identity']" (click)="toggleGroup('identity')">Identity</button>
              <button class="grp-btn" [class.active]="showGroup['physical']" (click)="toggleGroup('physical')">Physical</button>
              <button class="grp-btn" [class.active]="showGroup['location']" (click)="toggleGroup('location')">Location</button>
              <button class="grp-btn" [class.active]="showGroup['ownership']" (click)="toggleGroup('ownership')">Ownership</button>
              <button class="grp-btn" [class.active]="showGroup['financial']" (click)="toggleGroup('financial')">Financial</button>
              <button class="grp-btn" [class.active]="showGroup['verification']" (click)="toggleGroup('verification')">Verification</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Description</th>
                  @if (showGroup['identity']) {
                    <th>Municipal ID</th>
                    <th>Barcode</th>
                    <th>Old Barcode</th>
                    <th>Serial No</th>
                    <th>Reg. No</th>
                    <th>Parent ID</th>
                    <th>Main Asset ID</th>
                    <th>Main Asset</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Image Ref</th>
                  }
                  @if (showGroup['physical']) {
                    <th>Type</th>
                    <th>Category</th>
                    <th>Sub-Category</th>
                    <th>Class</th>
                    <th>Infra/Non-Infra</th>
                    <th>Measurement</th>
                    <th>UoM</th>
                    <th>Dim1</th>
                    <th>Dim2</th>
                    <th>Dim3</th>
                    <th>Quantity</th>
                    <th>Diameter</th>
                    <th>Capacity</th>
                    <th>Condition</th>
                    <th>Status</th>
                  }
                  @if (showGroup['location']) {
                    <th>Town</th>
                    <th>Suburb</th>
                    <th>Ward</th>
                    <th>Street</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Room</th>
                    <th>Zoning</th>
                    <th>Erf No</th>
                    <th>Erf Size (m²)</th>
                    <th>Portion No</th>
                    <th>Unit No</th>
                    <th>Floor Area</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  }
                  @if (showGroup['ownership']) {
                    <th>Department</th>
                    <th>Division</th>
                    <th>Custodian</th>
                    <th>Custodian ID No</th>
                    <th>Ownership</th>
                    <th>Municipal Service</th>
                  }
                  @if (showGroup['financial']) {
                    <th style="text-align:right">Purchase Amt</th>
                    <th style="text-align:right">Carrying Amt</th>
                  }
                  @if (showGroup['verification']) {
                    <th>Flag</th>
                    <th>Verified By</th>
                    <th>Verification Date</th>
                    <th>Temp Verif. Date</th>
                    <th>Found</th>
                    <th>Keep/Dispose</th>
                    <th>Revisit</th>
                    <th>Reason for Revisit</th>
                    <th>Comments</th>
                  }
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track item.verificationItemId) {
                  <tr>
                    <td>{{item.assetRegisterItemId}}</td>
                    <td class="desc-cell" [matTooltip]="item.description">{{item.description}}</td>
                    @if (showGroup['identity']) {
                      <td>{{item.municipalAssetId}}</td>
                      <td>{{item.barcode}}</td>
                      <td>{{item.oldBarCode}}</td>
                      <td>{{item.serialNumber}}</td>
                      <td>{{item.registrationNumber}}</td>
                      <td>{{item.parentAssetRegisterItemId}}</td>
                      <td>{{item.mainAssetId}}</td>
                      <td>{{item.mainAssetDescription}}</td>
                      <td>{{item.make}}</td>
                      <td>{{item.model}}</td>
                      <td>{{item.imageRef}}</td>
                    }
                    @if (showGroup['physical']) {
                      <td>{{item.assetTypeDesc}}</td>
                      <td>{{item.assetCategoryDesc}}</td>
                      <td>{{item.assetSubCategoryDesc}}</td>
                      <td>{{item.assetClassDesc}}</td>
                      <td>{{item.infraOrNonInfra}}</td>
                      <td>{{item.measurementTypeDesc}}</td>
                      <td>{{item.uomDesc}}</td>
                      <td>{{item.dim1}}</td>
                      <td>{{item.dim2}}</td>
                      <td>{{item.dim3}}</td>
                      <td>{{item.quantity}}</td>
                      <td>{{item.diameter}}</td>
                      <td>{{item.capacity}}</td>
                      <td>{{item.conditionDesc}}</td>
                      <td>{{item.statusDesc}}</td>
                    }
                    @if (showGroup['location']) {
                      <td>{{item.townDesc}}</td>
                      <td>{{item.suburbDesc}}</td>
                      <td>{{item.wardDesc}}</td>
                      <td>{{item.streetDesc}}</td>
                      <td>{{item.buildingDesc}}</td>
                      <td>{{item.floorDesc}}</td>
                      <td>{{item.roomId}}</td>
                      <td>{{item.zoningId}}</td>
                      <td>{{item.erfNumber}}</td>
                      <td>{{item.erfSizeM2}}</td>
                      <td>{{item.portionNumber}}</td>
                      <td>{{item.unitNumber}}</td>
                      <td>{{item.floorArea}}</td>
                      <td>{{item.latitude}}</td>
                      <td>{{item.longitude}}</td>
                    }
                    @if (showGroup['ownership']) {
                      <td>{{item.departmentDesc}}</td>
                      <td>{{item.divisionName}}</td>
                      <td>{{item.custodianName}}</td>
                      <td>{{item.custodianIdNumber}}</td>
                      <td>{{item.assetOwnershipDesc}}</td>
                      <td>{{item.basicMunicipalityServiceDesc}}</td>
                    }
                    @if (showGroup['financial']) {
                      <td style="text-align:right">{{formatCurrency(item.purchaseAmount)}}</td>
                      <td style="text-align:right">{{formatCurrency(item.carryingAmount)}}</td>
                    }
                    @if (showGroup['verification']) {
                      <td><span class="flag-badge" [class]="getFlagClass(item.verificationFlag)">{{item.verificationFlag || 'Not Started'}}</span></td>
                      <td>{{item.verificationDoneByName}}</td>
                      <td>{{formatDate(item.verificationDate)}}</td>
                      <td>{{formatDate(item.tempVerificationDate)}}</td>
                      <td>{{item.assetFound || '--'}}</td>
                      <td>{{item.keepOnRegisterDispose || '--'}}</td>
                      <td>{{item.revisit === 1 ? 'Yes' : item.revisit === 0 ? 'No' : '--'}}</td>
                      <td>{{item.reasonForRevisit || '--'}}</td>
                      <td>{{item.verificationComments || '--'}}</td>
                    }
                    <td>
                      <button mat-icon-button matTooltip="View audit trail" (click)="toggleAudit(item)">
                        <mat-icon style="font-size:18px">history</mat-icon>
                      </button>
                    </td>
                  </tr>
                  @if (expandedAuditId === item.verificationItemId) {
                    <tr class="audit-before-row">
                      <td class="audit-row-label">Before</td>
                      <td></td>
                      @if (showGroup['identity']) {
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      }
                      @if (showGroup['physical']) {
                        <td></td><td></td><td></td><td></td><td></td>
                        <td>{{auditFromMap['MeasurementType_ID']}}</td>
                        <td>{{auditFromMap['UoM']}}</td>
                        <td>{{auditFromMap['Dim1']}}</td>
                        <td>{{auditFromMap['Dim2']}}</td>
                        <td>{{auditFromMap['Dim3']}}</td>
                        <td>{{auditFromMap['Quantity']}}</td>
                        <td>{{auditFromMap['Diameter']}}</td>
                        <td>{{auditFromMap['Capacity']}}</td>
                        <td>{{auditFromMap['AssetCondition_ID']}}</td>
                        <td>{{auditFromMap['AssetStatus_ID']}}</td>
                      }
                      @if (showGroup['location']) {
                        <td>{{auditFromMap['Town_ID']}}</td>
                        <td>{{auditFromMap['SuburbID']}}</td>
                        <td>{{auditFromMap['Ward_ID']}}</td>
                        <td>{{auditFromMap['Street_ID']}}</td>
                        <td>{{auditFromMap['Building_ID']}}</td>
                        <td>{{auditFromMap['FloorID']}}</td>
                        <td>{{auditFromMap['Room_ID']}}</td>
                        <td>{{auditFromMap['Zoning_ID']}}</td>
                        <td>{{auditFromMap['ErfNumber']}}</td>
                        <td>{{auditFromMap['ErfSizeM2']}}</td>
                        <td>{{auditFromMap['PortionNumber']}}</td>
                        <td>{{auditFromMap['UnitNumber']}}</td>
                        <td>{{auditFromMap['Floor_Area']}}</td>
                        <td>{{auditFromMap['latitude']}}</td>
                        <td>{{auditFromMap['longitude']}}</td>
                      }
                      @if (showGroup['ownership']) {
                        <td>{{auditFromMap['MunicipalDepartment_ID']}}</td>
                        <td>{{auditFromMap['DivisionID']}}</td>
                        <td>{{auditFromMap['Custodian_ID']}}</td>
                        <td>{{auditFromMap['CustodianIdNumber']}}</td>
                        <td>{{auditFromMap['AssetOwnership_ID']}}</td>
                        <td>{{auditFromMap['BasicMunicipalityService']}}</td>
                      }
                      @if (showGroup['financial']) {
                        <td></td><td></td>
                      }
                      @if (showGroup['verification']) {
                        <td></td>
                        <td>{{auditFromMap['VerificationDoneBy']}}</td>
                        <td></td>
                        <td>{{auditFromMap['Temp_VerificationDate']}}</td>
                        <td>{{auditFromMap['Asset_Found']}}</td>
                        <td>{{auditFromMap['Keep_on_Register_Dispose']}}</td>
                        <td></td><td></td>
                        <td>{{auditFromMap['Verification_Comments']}}</td>
                      }
                      <td></td>
                    </tr>
                    <tr class="audit-after-row">
                      <td class="audit-row-label">After</td>
                      <td></td>
                      @if (showGroup['identity']) {
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      }
                      @if (showGroup['physical']) {
                        <td></td><td></td><td></td><td></td><td></td>
                        <td>{{auditToMap['MeasurementType_ID']}}</td>
                        <td>{{auditToMap['UoM']}}</td>
                        <td>{{auditToMap['Dim1']}}</td>
                        <td>{{auditToMap['Dim2']}}</td>
                        <td>{{auditToMap['Dim3']}}</td>
                        <td>{{auditToMap['Quantity']}}</td>
                        <td>{{auditToMap['Diameter']}}</td>
                        <td>{{auditToMap['Capacity']}}</td>
                        <td>{{auditToMap['AssetCondition_ID']}}</td>
                        <td>{{auditToMap['AssetStatus_ID']}}</td>
                      }
                      @if (showGroup['location']) {
                        <td>{{auditToMap['Town_ID']}}</td>
                        <td>{{auditToMap['SuburbID']}}</td>
                        <td>{{auditToMap['Ward_ID']}}</td>
                        <td>{{auditToMap['Street_ID']}}</td>
                        <td>{{auditToMap['Building_ID']}}</td>
                        <td>{{auditToMap['FloorID']}}</td>
                        <td>{{auditToMap['Room_ID']}}</td>
                        <td>{{auditToMap['Zoning_ID']}}</td>
                        <td>{{auditToMap['ErfNumber']}}</td>
                        <td>{{auditToMap['ErfSizeM2']}}</td>
                        <td>{{auditToMap['PortionNumber']}}</td>
                        <td>{{auditToMap['UnitNumber']}}</td>
                        <td>{{auditToMap['Floor_Area']}}</td>
                        <td>{{auditToMap['latitude']}}</td>
                        <td>{{auditToMap['longitude']}}</td>
                      }
                      @if (showGroup['ownership']) {
                        <td>{{auditToMap['MunicipalDepartment_ID']}}</td>
                        <td>{{auditToMap['DivisionID']}}</td>
                        <td>{{auditToMap['Custodian_ID']}}</td>
                        <td>{{auditToMap['CustodianIdNumber']}}</td>
                        <td>{{auditToMap['AssetOwnership_ID']}}</td>
                        <td>{{auditToMap['BasicMunicipalityService']}}</td>
                      }
                      @if (showGroup['financial']) {
                        <td></td><td></td>
                      }
                      @if (showGroup['verification']) {
                        <td></td>
                        <td>{{auditToMap['VerificationDoneBy']}}</td>
                        <td></td>
                        <td>{{auditToMap['Temp_VerificationDate']}}</td>
                        <td>{{auditToMap['Asset_Found']}}</td>
                        <td>{{auditToMap['Keep_on_Register_Dispose']}}</td>
                        <td></td><td></td>
                        <td>{{auditToMap['Verification_Comments']}}</td>
                      }
                      <td></td>
                    </tr>
                  }
                }
                @if (items.length === 0) {
                  <tr><td [attr.colspan]="overviewColspan" style="text-align:center;padding:40px;color:#94a3b8">No items found</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab === 'manage' && !register?.isHistory) {
        <div class="tab-content">
          <div class="manage-toolbar">
            <mat-form-field appearance="outline" style="width:280px">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadItems()">
            </mat-form-field>
            <div class="col-group-toggles">
              <button class="grp-btn" [class.active]="showGroup['identity']" (click)="toggleGroup('identity')">Identity</button>
              <button class="grp-btn" [class.active]="showGroup['physical']" (click)="toggleGroup('physical')">Physical</button>
              <button class="grp-btn" [class.active]="showGroup['location']" (click)="toggleGroup('location')">Location</button>
              <button class="grp-btn" [class.active]="showGroup['ownership']" (click)="toggleGroup('ownership')">Ownership</button>
              <button class="grp-btn" [class.active]="showGroup['financial']" (click)="toggleGroup('financial')">Financial</button>
            </div>
            <div style="flex:1"></div>
            <input type="file" accept=".csv" style="display:none" id="manage-csv-input" (change)="onManageCsvSelected($event)">
            <button mat-stroked-button (click)="triggerManageCsvUpload()" style="height:40px;white-space:nowrap" [disabled]="importingCsv">
              <mat-icon>upload</mat-icon> Import CSV
            </button>
            <button mat-flat-button class="submit-btn" (click)="submitSelected()" [disabled]="manageSelected.size === 0">
              <mat-icon>send</mat-icon> Submit for Approval ({{manageSelected.size}})
            </button>
          </div>
          @if (importResult) {
            <div class="import-result" [class.import-error]="importResult.error">
              @if (importResult.error) {
                <b>Import error:</b> {{importResult.error}}
                @if (importResult.columns && importResult.columns.length > 0) {
                  <br><span>Columns with type errors: {{importResult.columns.join(', ')}}</span>
                }
              } @else {
                <b>Import complete:</b> {{importResult.imported}} record(s) updated, {{importResult.skipped}} skipped.
              }
              <button mat-icon-button style="margin-left:8px" (click)="importResult = null"><mat-icon style="font-size:16px">close</mat-icon></button>
            </div>
          }
          <div class="table-wrap">
            <table class="data-table manage-table">
              <thead>
                <tr>
                  <th style="width:40px"><mat-checkbox [checked]="allManageSelected()" [indeterminate]="someManageSelected()" (change)="toggleManageAll($event)"></mat-checkbox></th>
                  <th>Asset ID</th>
                  <th>Description</th>
                  @if (showGroup['identity']) {
                    <th>Municipal ID</th>
                    <th>Barcode</th>
                    <th>Old Barcode</th>
                    <th>Serial No</th>
                    <th>Reg. No</th>
                    <th>Parent ID</th>
                    <th>Main Asset ID</th>
                    <th>Main Asset</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Image Ref</th>
                  }
                  @if (showGroup['physical']) {
                    <th>Type</th>
                    <th>Category</th>
                    <th>Sub-Category</th>
                    <th>Class</th>
                    <th>Infra/Non-Infra</th>
                    <th>Measurement</th>
                    <th>UoM</th>
                    <th>Dim1</th>
                    <th>Dim2</th>
                    <th>Dim3</th>
                    <th>Quantity</th>
                    <th>Diameter</th>
                    <th>Capacity</th>
                    <th>Condition</th>
                    <th>Status</th>
                  }
                  @if (showGroup['location']) {
                    <th>Town</th>
                    <th>Suburb</th>
                    <th>Ward</th>
                    <th>Street</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Room</th>
                    <th>Zoning</th>
                    <th>Erf No</th>
                    <th>Erf Size (m²)</th>
                    <th>Portion No</th>
                    <th>Unit No</th>
                    <th>Floor Area</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  }
                  @if (showGroup['ownership']) {
                    <th>Department</th>
                    <th>Division</th>
                    <th>Custodian</th>
                    <th>Custodian ID No</th>
                    <th>Ownership</th>
                    <th>Municipal Service</th>
                  }
                  @if (showGroup['financial']) {
                    <th style="text-align:right">Purchase Amt</th>
                    <th style="text-align:right">Carrying Amt</th>
                  }
                  <th>Flag</th>
                  <th>Temp Verif. Date</th>
                  <th>Verified By</th>
                  <th>Found</th>
                  <th>Keep/Dispose</th>
                  <th>Comments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track item.verificationItemId) {
                  <tr [class.revisit-row]="item.verificationFlag === 'Revisit – Not Approved'">
                    <td><mat-checkbox [checked]="manageSelected.has(item.verificationItemId)" (change)="toggleManageItem(item.verificationItemId)"></mat-checkbox></td>
                    <td>{{item.assetRegisterItemId}}</td>
                    <td class="desc-cell" [matTooltip]="item.description">{{item.description}}</td>
                    @if (showGroup['identity']) {
                      <td>{{item.municipalAssetId}}</td>
                      <td>{{item.barcode}}</td>
                      <td>{{item.oldBarCode}}</td>
                      <td>{{item.serialNumber}}</td>
                      <td>{{item.registrationNumber}}</td>
                      <td>{{item.parentAssetRegisterItemId}}</td>
                      <td>{{item.mainAssetId}}</td>
                      <td>{{item.mainAssetDescription}}</td>
                      <td>{{item.make}}</td>
                      <td>{{item.model}}</td>
                      <td>{{item.imageRef}}</td>
                    }
                    @if (showGroup['physical']) {
                      <td>{{item.assetTypeDesc}}</td>
                      <td>{{item.assetCategoryDesc}}</td>
                      <td>{{item.assetSubCategoryDesc}}</td>
                      <td>{{item.assetClassDesc}}</td>
                      <td>{{item.infraOrNonInfra}}</td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.measurementTypeId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (mt of measurementTypes; track mt.assetConfig_MeasurementType_ID) {
                            <option [ngValue]="mt.assetConfig_MeasurementType_ID">{{mt.name}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.uom" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (u of uoms; track u.unitOfIssueId) {
                            <option [ngValue]="u.unitOfIssueId">{{u.unitOfIssueDesc}}</option>
                          }
                        </select>
                      </td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.dim1" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.dim2" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.dim3" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.quantity" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.diameter" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.capacity" (ngModelChange)="item._dirty = true"></td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.assetConditionId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (c of conditions; track c.assetCondition_ID) {
                            <option [ngValue]="c.assetCondition_ID">{{c.assetConditionDesc}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.assetStatusId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (s of assetStatuses; track s.assetStatus_ID) {
                            <option [ngValue]="s.assetStatus_ID">{{s.assetStatusDesc}}</option>
                          }
                        </select>
                      </td>
                    }
                    @if (showGroup['location']) {
                      <td>
                        <select class="inline-select" [(ngModel)]="item.townId" (ngModelChange)="onTownChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (t of lookupTowns; track t.id) {
                            <option [ngValue]="t.id">{{t.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.suburbId" (ngModelChange)="onSuburbChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (s of filteredSuburbs(item); track s.id) {
                            <option [ngValue]="s.id">{{s.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.wardId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (w of lookupWards; track w.id) {
                            <option [ngValue]="w.id">{{w.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.streetId" (ngModelChange)="onStreetChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (s of filteredStreets(item); track s.id) {
                            <option [ngValue]="s.id">{{s.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.buildingId" (ngModelChange)="onBuildingChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (b of filteredBuildings(item); track b.id) {
                            <option [ngValue]="b.id">{{b.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.floorId" (ngModelChange)="onFloorChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (f of filteredFloors(item); track f.id) {
                            <option [ngValue]="f.id">{{f.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.roomId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (r of filteredRooms(item); track r.id) {
                            <option [ngValue]="r.id">{{r.description}}</option>
                          }
                        </select>
                      </td>
                      <td><input type="number" class="inline-input" style="width:60px" [(ngModel)]="item.zoningId" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="text" class="inline-input" style="width:80px" [(ngModel)]="item.erfNumber" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.erfSizeM2" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="text" class="inline-input" style="width:60px" [(ngModel)]="item.portionNumber" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="text" class="inline-input" style="width:60px" [(ngModel)]="item.unitNumber" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="number" class="inline-input" style="width:70px" [(ngModel)]="item.floorArea" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="text" class="inline-input" style="width:90px" [(ngModel)]="item.latitude" (ngModelChange)="item._dirty = true"></td>
                      <td><input type="text" class="inline-input" style="width:90px" [(ngModel)]="item.longitude" (ngModelChange)="item._dirty = true"></td>
                    }
                    @if (showGroup['ownership']) {
                      <td>
                        <select class="inline-select" [(ngModel)]="item.municipalDepartmentId" (ngModelChange)="onDepartmentChange(item)">
                          <option [ngValue]="null">--</option>
                          @for (dept of lookupDepartments; track dept.id) {
                            <option [ngValue]="dept.id">{{dept.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.divisionId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (div of filteredDivisions(item); track div.id) {
                            <option [ngValue]="div.id">{{div.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.custodianId" (ngModelChange)="item._dirty = true" style="width:140px">
                          <option [ngValue]="null">--</option>
                          @for (e of employees; track e.employeeId) {
                            <option [ngValue]="e.employeeId">{{e.surname}}, {{e.firstName}}</option>
                          }
                        </select>
                      </td>
                      <td><input type="text" class="inline-input" style="width:100px" [(ngModel)]="item.custodianIdNumber" (ngModelChange)="item._dirty = true"></td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.assetOwnershipId" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (o of lookupOwnerships; track o.id) {
                            <option [ngValue]="o.id">{{o.description}}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="inline-select" [(ngModel)]="item.basicMunicipalityService" (ngModelChange)="item._dirty = true">
                          <option [ngValue]="null">--</option>
                          @for (ms of municipalServices; track ms.assetMunicipalServicesID) {
                            <option [ngValue]="ms.assetMunicipalServicesID">{{ms.assetMunicipalServicesDesc}}</option>
                          }
                        </select>
                      </td>
                    }
                    @if (showGroup['financial']) {
                      <td style="text-align:right">{{formatCurrency(item.purchaseAmount)}}</td>
                      <td style="text-align:right">{{formatCurrency(item.carryingAmount)}}</td>
                    }
                    <td><span class="flag-badge" [class]="getFlagClass(item.verificationFlag)">{{item.verificationFlag || 'Not Started'}}</span></td>
                    <td>
                      <input type="date" class="inline-input" [ngModel]="formatDateInput(item.tempVerificationDate)" (ngModelChange)="item.tempVerificationDate = $event; item._dirty = true">
                    </td>
                    <td>
                      <select class="inline-select" [(ngModel)]="item.verificationDoneBy" (ngModelChange)="item._dirty = true" style="width:140px">
                        <option [ngValue]="null">--</option>
                        @for (m of registerTeamMembers; track m.registerTeamMemberId) {
                          <option [ngValue]="m.registerTeamMemberId">{{m.employeeFullName || m.employeeName}}</option>
                        }
                      </select>
                    </td>
                    <td>
                      <select class="inline-select" [(ngModel)]="item.assetFound" (ngModelChange)="item._dirty = true">
                        <option [ngValue]="null">--</option>
                        <option value="Newly Added Asset">Newly Added Asset</option>
                        <option value="Asset Not Found">Asset Not Found</option>
                        <option value="Completed Projects">Completed Projects</option>
                        <option value="Asset Removed">Asset Removed</option>
                      </select>
                    </td>
                    <td>
                      <select class="inline-select" [(ngModel)]="item.keepOnRegisterDispose" (ngModelChange)="item._dirty = true">
                        <option [ngValue]="null">--</option>
                        <option value="Keep">Keep</option>
                        <option value="Dispose">Dispose</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="inline-input" style="width:120px" [(ngModel)]="item.verificationComments" (ngModelChange)="item._dirty = true" placeholder="Comments...">
                    </td>
                    <td>
                      <button mat-icon-button matTooltip="Save changes" [disabled]="!item._dirty" (click)="saveItem(item)">
                        <mat-icon [style.color]="item._dirty ? '#2563eb' : '#cbd5e1'">save</mat-icon>
                      </button>
                    </td>
                  </tr>
                  @if (item.verificationFlag === 'Revisit – Not Approved' && item.reasonForRevisit) {
                    <tr class="reason-row"><td [attr.colspan]="manageColspan"><mat-icon style="font-size:14px;color:#d97706;vertical-align:middle">warning</mat-icon> <strong>Revisit Reason:</strong> {{item.reasonForRevisit}}</td></tr>
                  }
                }
                @if (items.length === 0) {
                  <tr><td [attr.colspan]="manageColspan" style="text-align:center;padding:40px;color:#94a3b8">No items pending verification</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab === 'approve' && !register?.isHistory) {
        <div class="tab-content">
          <div class="manage-toolbar">
            <mat-form-field appearance="outline" style="width:280px">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadItems()">
            </mat-form-field>
            <div class="col-group-toggles">
              <button class="grp-btn" [class.active]="showGroup['identity']" (click)="toggleGroup('identity')">Identity</button>
              <button class="grp-btn" [class.active]="showGroup['physical']" (click)="toggleGroup('physical')">Physical</button>
              <button class="grp-btn" [class.active]="showGroup['location']" (click)="toggleGroup('location')">Location</button>
              <button class="grp-btn" [class.active]="showGroup['ownership']" (click)="toggleGroup('ownership')">Ownership</button>
              <button class="grp-btn" [class.active]="showGroup['financial']" (click)="toggleGroup('financial')">Financial</button>
            </div>
            <div style="flex:1"></div>
            <button mat-stroked-button style="margin-right:8px;color:#d97706;border-color:#d97706" (click)="backToManage()" [disabled]="approveSelected.size === 0">
              <mat-icon>undo</mat-icon> Back to Manage ({{approveSelected.size}})
            </button>
            <button mat-flat-button class="approve-btn" (click)="approveSelected_fn()" [disabled]="approveSelected.size === 0">
              <mat-icon>check_circle</mat-icon> Approve ({{approveSelected.size}})
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:40px"><mat-checkbox [checked]="allApproveSelected()" [indeterminate]="someApproveSelected()" (change)="toggleApproveAll($event)"></mat-checkbox></th>
                  <th>Asset ID</th>
                  <th>Description</th>
                  @if (showGroup['identity']) {
                    <th>Municipal ID</th>
                    <th>Barcode</th>
                    <th>Old Barcode</th>
                    <th>Serial No</th>
                    <th>Reg. No</th>
                    <th>Parent ID</th>
                    <th>Main Asset ID</th>
                    <th>Main Asset</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Image Ref</th>
                  }
                  @if (showGroup['physical']) {
                    <th>Type</th>
                    <th>Category</th>
                    <th>Sub-Category</th>
                    <th>Class</th>
                    <th>Infra/Non-Infra</th>
                    <th>Measurement</th>
                    <th>UoM</th>
                    <th>Dim1</th>
                    <th>Dim2</th>
                    <th>Dim3</th>
                    <th>Quantity</th>
                    <th>Diameter</th>
                    <th>Capacity</th>
                    <th>Condition</th>
                    <th>Status</th>
                  }
                  @if (showGroup['location']) {
                    <th>Town</th>
                    <th>Suburb</th>
                    <th>Ward</th>
                    <th>Street</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Room</th>
                    <th>Zoning</th>
                    <th>Erf No</th>
                    <th>Erf Size (m²)</th>
                    <th>Portion No</th>
                    <th>Unit No</th>
                    <th>Floor Area</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  }
                  @if (showGroup['ownership']) {
                    <th>Department</th>
                    <th>Division</th>
                    <th>Custodian</th>
                    <th>Custodian ID No</th>
                    <th>Ownership</th>
                    <th>Municipal Service</th>
                  }
                  @if (showGroup['financial']) {
                    <th style="text-align:right">Purchase Amt</th>
                    <th style="text-align:right">Carrying Amt</th>
                  }
                  <th>Flag</th>
                  <th>Verified By</th>
                  <th>Verification Date</th>
                  <th>Temp Verif. Date</th>
                  <th>Found</th>
                  <th>Keep/Dispose</th>
                  <th>Revisit</th>
                  <th>Reason for Revisit</th>
                  <th>Comments</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track item.verificationItemId) {
                  <tr>
                    <td><mat-checkbox [checked]="approveSelected.has(item.verificationItemId)" (change)="toggleApproveItem(item.verificationItemId)"></mat-checkbox></td>
                    <td>{{item.assetRegisterItemId}}</td>
                    <td class="desc-cell" [matTooltip]="item.description">{{item.description}}</td>
                    @if (showGroup['identity']) {
                      <td>{{item.municipalAssetId}}</td>
                      <td>{{item.barcode}}</td>
                      <td>{{item.oldBarCode}}</td>
                      <td>{{item.serialNumber}}</td>
                      <td>{{item.registrationNumber}}</td>
                      <td>{{item.parentAssetRegisterItemId}}</td>
                      <td>{{item.mainAssetId}}</td>
                      <td>{{item.mainAssetDescription}}</td>
                      <td>{{item.make}}</td>
                      <td>{{item.model}}</td>
                      <td>{{item.imageRef}}</td>
                    }
                    @if (showGroup['physical']) {
                      <td>{{item.assetTypeDesc}}</td>
                      <td>{{item.assetCategoryDesc}}</td>
                      <td>{{item.assetSubCategoryDesc}}</td>
                      <td>{{item.assetClassDesc}}</td>
                      <td>{{item.infraOrNonInfra}}</td>
                      <td>{{item.measurementTypeDesc}}</td>
                      <td>{{item.uomDesc}}</td>
                      <td>{{item.dim1}}</td>
                      <td>{{item.dim2}}</td>
                      <td>{{item.dim3}}</td>
                      <td>{{item.quantity}}</td>
                      <td>{{item.diameter}}</td>
                      <td>{{item.capacity}}</td>
                      <td>{{item.conditionDesc}}</td>
                      <td>{{item.statusDesc}}</td>
                    }
                    @if (showGroup['location']) {
                      <td>{{item.townDesc}}</td>
                      <td>{{item.suburbDesc}}</td>
                      <td>{{item.wardDesc}}</td>
                      <td>{{item.streetDesc}}</td>
                      <td>{{item.buildingDesc}}</td>
                      <td>{{item.floorDesc}}</td>
                      <td>{{item.roomId}}</td>
                      <td>{{item.zoningId}}</td>
                      <td>{{item.erfNumber}}</td>
                      <td>{{item.erfSizeM2}}</td>
                      <td>{{item.portionNumber}}</td>
                      <td>{{item.unitNumber}}</td>
                      <td>{{item.floorArea}}</td>
                      <td>{{item.latitude}}</td>
                      <td>{{item.longitude}}</td>
                    }
                    @if (showGroup['ownership']) {
                      <td>{{item.departmentDesc}}</td>
                      <td>{{item.divisionName}}</td>
                      <td>{{item.custodianName}}</td>
                      <td>{{item.custodianIdNumber}}</td>
                      <td>{{item.assetOwnershipDesc}}</td>
                      <td>{{item.basicMunicipalityServiceDesc}}</td>
                    }
                    @if (showGroup['financial']) {
                      <td style="text-align:right">{{formatCurrency(item.purchaseAmount)}}</td>
                      <td style="text-align:right">{{formatCurrency(item.carryingAmount)}}</td>
                    }
                    <td><span class="flag-badge" [class]="getFlagClass(item.verificationFlag)">{{item.verificationFlag || 'Not Started'}}</span></td>
                    <td>{{item.verificationDoneByName}}</td>
                    <td>{{formatDate(item.verificationDate)}}</td>
                    <td>{{formatDate(item.tempVerificationDate)}}</td>
                    <td>{{item.assetFound || '--'}}</td>
                    <td>{{item.keepOnRegisterDispose || '--'}}</td>
                    <td>{{item.revisit === 1 ? 'Yes' : item.revisit === 0 ? 'No' : '--'}}</td>
                    <td>{{item.reasonForRevisit || '--'}}</td>
                    <td>{{item.verificationComments || '--'}}</td>
                    <td>
                      <button mat-icon-button matTooltip="View audit trail" (click)="toggleAudit(item)">
                        <mat-icon style="font-size:18px">history</mat-icon>
                      </button>
                    </td>
                  </tr>
                  @if (expandedAuditId === item.verificationItemId) {
                    <tr class="audit-before-row">
                      <td></td>
                      <td class="audit-row-label">Before</td>
                      <td></td>
                      @if (showGroup['identity']) {
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      }
                      @if (showGroup['physical']) {
                        <td></td><td></td><td></td><td></td><td></td>
                        <td>{{auditFromMap['MeasurementType_ID']}}</td>
                        <td>{{auditFromMap['UoM']}}</td>
                        <td>{{auditFromMap['Dim1']}}</td>
                        <td>{{auditFromMap['Dim2']}}</td>
                        <td>{{auditFromMap['Dim3']}}</td>
                        <td>{{auditFromMap['Quantity']}}</td>
                        <td>{{auditFromMap['Diameter']}}</td>
                        <td>{{auditFromMap['Capacity']}}</td>
                        <td>{{auditFromMap['AssetCondition_ID']}}</td>
                        <td>{{auditFromMap['AssetStatus_ID']}}</td>
                      }
                      @if (showGroup['location']) {
                        <td>{{auditFromMap['Town_ID']}}</td>
                        <td>{{auditFromMap['SuburbID']}}</td>
                        <td>{{auditFromMap['Ward_ID']}}</td>
                        <td>{{auditFromMap['Street_ID']}}</td>
                        <td>{{auditFromMap['Building_ID']}}</td>
                        <td>{{auditFromMap['FloorID']}}</td>
                        <td>{{auditFromMap['Room_ID']}}</td>
                        <td>{{auditFromMap['Zoning_ID']}}</td>
                        <td>{{auditFromMap['ErfNumber']}}</td>
                        <td>{{auditFromMap['ErfSizeM2']}}</td>
                        <td>{{auditFromMap['PortionNumber']}}</td>
                        <td>{{auditFromMap['UnitNumber']}}</td>
                        <td>{{auditFromMap['Floor_Area']}}</td>
                        <td>{{auditFromMap['latitude']}}</td>
                        <td>{{auditFromMap['longitude']}}</td>
                      }
                      @if (showGroup['ownership']) {
                        <td>{{auditFromMap['MunicipalDepartment_ID']}}</td>
                        <td>{{auditFromMap['DivisionID']}}</td>
                        <td>{{auditFromMap['Custodian_ID']}}</td>
                        <td>{{auditFromMap['CustodianIdNumber']}}</td>
                        <td>{{auditFromMap['AssetOwnership_ID']}}</td>
                        <td>{{auditFromMap['BasicMunicipalityService']}}</td>
                      }
                      @if (showGroup['financial']) {
                        <td></td><td></td>
                      }
                      <td></td>
                      <td>{{auditFromMap['VerificationDoneBy']}}</td>
                      <td></td>
                      <td>{{auditFromMap['Temp_VerificationDate']}}</td>
                      <td>{{auditFromMap['Asset_Found']}}</td>
                      <td>{{auditFromMap['Keep_on_Register_Dispose']}}</td>
                      <td></td><td></td>
                      <td>{{auditFromMap['Verification_Comments']}}</td>
                      <td></td>
                    </tr>
                    <tr class="audit-after-row">
                      <td></td>
                      <td class="audit-row-label">After</td>
                      <td></td>
                      @if (showGroup['identity']) {
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      }
                      @if (showGroup['physical']) {
                        <td></td><td></td><td></td><td></td><td></td>
                        <td>{{auditToMap['MeasurementType_ID']}}</td>
                        <td>{{auditToMap['UoM']}}</td>
                        <td>{{auditToMap['Dim1']}}</td>
                        <td>{{auditToMap['Dim2']}}</td>
                        <td>{{auditToMap['Dim3']}}</td>
                        <td>{{auditToMap['Quantity']}}</td>
                        <td>{{auditToMap['Diameter']}}</td>
                        <td>{{auditToMap['Capacity']}}</td>
                        <td>{{auditToMap['AssetCondition_ID']}}</td>
                        <td>{{auditToMap['AssetStatus_ID']}}</td>
                      }
                      @if (showGroup['location']) {
                        <td>{{auditToMap['Town_ID']}}</td>
                        <td>{{auditToMap['SuburbID']}}</td>
                        <td>{{auditToMap['Ward_ID']}}</td>
                        <td>{{auditToMap['Street_ID']}}</td>
                        <td>{{auditToMap['Building_ID']}}</td>
                        <td>{{auditToMap['FloorID']}}</td>
                        <td>{{auditToMap['Room_ID']}}</td>
                        <td>{{auditToMap['Zoning_ID']}}</td>
                        <td>{{auditToMap['ErfNumber']}}</td>
                        <td>{{auditToMap['ErfSizeM2']}}</td>
                        <td>{{auditToMap['PortionNumber']}}</td>
                        <td>{{auditToMap['UnitNumber']}}</td>
                        <td>{{auditToMap['Floor_Area']}}</td>
                        <td>{{auditToMap['latitude']}}</td>
                        <td>{{auditToMap['longitude']}}</td>
                      }
                      @if (showGroup['ownership']) {
                        <td>{{auditToMap['MunicipalDepartment_ID']}}</td>
                        <td>{{auditToMap['DivisionID']}}</td>
                        <td>{{auditToMap['Custodian_ID']}}</td>
                        <td>{{auditToMap['CustodianIdNumber']}}</td>
                        <td>{{auditToMap['AssetOwnership_ID']}}</td>
                        <td>{{auditToMap['BasicMunicipalityService']}}</td>
                      }
                      @if (showGroup['financial']) {
                        <td></td><td></td>
                      }
                      <td></td>
                      <td>{{auditToMap['VerificationDoneBy']}}</td>
                      <td></td>
                      <td>{{auditToMap['Temp_VerificationDate']}}</td>
                      <td>{{auditToMap['Asset_Found']}}</td>
                      <td>{{auditToMap['Keep_on_Register_Dispose']}}</td>
                      <td></td><td></td>
                      <td>{{auditToMap['Verification_Comments']}}</td>
                      <td></td>
                    </tr>
                  }
                }
                @if (items.length === 0) {
                  <tr><td [attr.colspan]="approveColspan" style="text-align:center;padding:40px;color:#94a3b8">No items pending approval</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if ((activeTab === 'manage' || activeTab === 'approve') && register?.isHistory) {
        <div class="tab-content" style="text-align:center;padding:60px">
          <mat-icon style="font-size:48px;width:48px;height:48px;color:#cbd5e1">lock</mat-icon>
          <p style="color:#64748b;margin-top:12px">This register has been moved to history. Manage and Approval tabs are read-only.</p>
        </div>
      }

      @if (activeTab === 'team') {
        <div class="tab-content">
          <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h2 style="font-size:16px;font-weight:600;color:#1e293b;margin:0;display:flex;align-items:center;gap:8px">
                <mat-icon style="color:#059669">group</mat-icon> Team Members
              </h2>
            </div>
            @if (registerTeamMembers.length === 0) {
              <p style="color:#94a3b8;text-align:center;padding:32px 0">No team members assigned</p>
            } @else {
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
                <thead>
                  <tr style="background:#f8fafc">
                    <th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;color:#64748b;font-weight:600">Name</th>
                    <th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;color:#64748b;font-weight:600">Type</th>
                    <th style="padding:8px 12px;border:1px solid #e2e8f0;width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of registerTeamMembers; track m.registerTeamMemberId) {
                    <tr>
                      <td style="padding:8px 12px;border:1px solid #e2e8f0">{{m.employeeFullName || m.employeeName}}</td>
                      <td style="padding:8px 12px;border:1px solid #e2e8f0">
                        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px"
                              [style.background]="m.isExternal ? '#fef3c7' : '#dbeafe'"
                              [style.color]="m.isExternal ? '#92400e' : '#1d4ed8'">
                          {{m.isExternal ? 'External' : 'Internal'}}
                        </span>
                      </td>
                      <td style="padding:4px;border:1px solid #e2e8f0;text-align:center">
                        <button mat-icon-button (click)="removeRegDetailMember(m)">
                          <mat-icon style="font-size:18px;color:#ef4444">delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px">
              <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 12px">Add Team Member</h3>
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                <label style="font-size:13px;color:#475569;display:flex;align-items:center;gap:6px;white-space:nowrap;margin-bottom:0">
                  <input type="checkbox" [(ngModel)]="regDetailNewMember.isExternal" (change)="onRegDetailExternalToggle()"> External
                </label>
                @if (regDetailNewMember.isExternal) {
                  <mat-form-field appearance="outline" style="flex:1;min-width:200px;margin-bottom:-1.25em">
                    <mat-label>Full Name</mat-label>
                    <input matInput [(ngModel)]="regDetailNewMember.employeeName">
                  </mat-form-field>
                } @else {
                  <mat-form-field appearance="outline" style="flex:1;min-width:200px;margin-bottom:-1.25em">
                    <mat-label>Employee</mat-label>
                    <mat-select [(ngModel)]="regDetailNewMember.employeeId">
                      @for (e of employees; track e.employeeId) {
                        <mat-option [value]="e.employeeId">{{e.surname}}, {{e.firstName}}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                <button mat-flat-button style="background:#059669;color:white;border-radius:8px;height:42px;white-space:nowrap" (click)="addRegDetailMember()" [disabled]="regDetailAddingMember">
                  <mat-icon>person_add</mat-icon> Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'map') {
        <div class="tab-content">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-size:14px;font-weight:600;color:#1e293b">Verification Map</span>
            <mat-form-field appearance="outline" style="width:180px">
              <mat-label>Status Filter</mat-label>
              <mat-select [(ngModel)]="mapStatusFilter" (selectionChange)="loadMapItems()">
                @for (s of mapStatusOptions; track s) {
                  <mat-option [value]="s">{{s}}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <span style="font-size:13px;color:#64748b">{{mapItems.length}} items with GPS coordinates</span>
          </div>
          <div style="position:relative;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            @if (mapLoadingItems) {
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            }
            <div id="verif-detail-map" style="height:520px;width:100%"></div>
          </div>
          <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap">
            <span class="map-legend-dot" style="background:#6b7280"></span><span style="font-size:12px;color:#475569">Pending</span>
            <span class="map-legend-dot" style="background:#2563eb"></span><span style="font-size:12px;color:#475569">Waiting Approval</span>
            <span class="map-legend-dot" style="background:#16a34a"></span><span style="font-size:12px;color:#475569">Approved</span>
            <span class="map-legend-dot" style="background:#d97706"></span><span style="font-size:12px;color:#475569">Verified</span>
          </div>
        </div>
      }
    }

    @if (showBackToManageDialog) {
      <div class="dialog-overlay" (click)="showBackToManageDialog = false">
        <div class="dialog-card" (click)="$event.stopPropagation()">
          <h3>Send Back to Manage</h3>
          <p style="color:#64748b;font-size:13px">Provide a reason for sending {{approveSelected.size}} item(s) back for revision.</p>
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Reason</mat-label>
            <textarea matInput [(ngModel)]="backToManageReason" rows="3"></textarea>
          </mat-form-field>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
            <button mat-stroked-button (click)="showBackToManageDialog = false">Cancel</button>
            <button mat-flat-button style="background:#d97706;color:white" (click)="confirmBackToManage()">Confirm</button>
          </div>
        </div>
      </div>
    }

    @if (showApproveDialog) {
      <div class="dialog-overlay" (click)="showApproveDialog = false">
        <div class="dialog-card" (click)="$event.stopPropagation()">
          <h3>Approve Verification Items</h3>
          <p style="color:#64748b;font-size:13px">Approve {{approveSelected.size}} item(s)? This will update the main Asset Register.</p>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button mat-stroked-button (click)="showApproveDialog = false">Cancel</button>
            <button mat-flat-button style="background:#16a34a;color:white" (click)="confirmApprove()">Approve</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .history-tag { background:#fef3c7; color:#92400e; font-size:11px; font-weight:600; padding:2px 8px; border-radius:8px; margin-left:8px; }
    .tab-bar { display:flex; gap:4px; margin-bottom:20px; background:#f1f5f9; padding:4px; border-radius:10px; width:fit-content; }
    .tab {
      display:flex; align-items:center; gap:6px; padding:8px 16px; border:none;
      background:transparent; border-radius:8px; font-size:13px; font-weight:500;
      color:#64748b; cursor:pointer; transition:all 0.15s;
    }
    .tab mat-icon { font-size:18px; width:18px; height:18px; }
    .tab.active { background:white; color:#1e293b; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .tab.disabled-tab { opacity:0.4; pointer-events:none; }
    .tab-content { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px; }
    .search-row { display:flex; align-items:center; gap:16px; margin-bottom:12px; flex-wrap:wrap; }
    .manage-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
    .col-group-toggles { display:flex; gap:4px; flex-wrap:wrap; }
    .grp-btn {
      padding:4px 10px; border:1px solid #e2e8f0; border-radius:6px; font-size:11px;
      font-weight:500; color:#64748b; background:white; cursor:pointer; transition:all 0.15s;
    }
    .grp-btn.active { background:#2563eb; color:white; border-color:#2563eb; }
    .grp-btn:hover { border-color:#93c5fd; }
    .table-wrap { overflow-x:auto; border:1px solid #e2e8f0; border-radius:8px; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { background:#f8fafc; padding:10px 12px; text-align:left; font-weight:600; color:#475569; position:sticky; top:0; z-index:1; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
    .data-table td { padding:8px 12px; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
    .data-table tr:hover { background:#fafbfc; }
    .desc-cell { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .flag-badge { font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; white-space:nowrap; }
    .flag-not-started { background:#f1f5f9; color:#64748b; }
    .flag-submitted { background:#dbeafe; color:#1d4ed8; }
    .flag-approved { background:#dcfce7; color:#16a34a; }
    .flag-revisit { background:#fef3c7; color:#92400e; }
    .flag-revisited { background:#e0e7ff; color:#4338ca; }
    .inline-input {
      padding:4px 8px; border:1px solid #e2e8f0; border-radius:6px; font-size:12px;
      background:white; outline:none; transition:border-color 0.15s;
    }
    .inline-input:focus { border-color:#3b82f6; }
    .inline-select {
      padding:4px 6px; border:1px solid #e2e8f0; border-radius:6px; font-size:12px;
      background:white; outline:none; cursor:pointer;
    }
    .inline-select:focus { border-color:#3b82f6; }
    .revisit-row { background:#fffbeb !important; }
    .reason-row td { background:#fef3c7; font-size:12px; color:#92400e; padding:6px 12px !important; }
    .submit-btn { background:#2563eb; color:white; border-radius:8px; display:flex; align-items:center; gap:6px; }
    .approve-btn { background:#16a34a; color:white; border-radius:8px; display:flex; align-items:center; gap:6px; }
    .audit-before-row td { background:#fff5f5; padding:3px 8px !important; font-size:11px; color:#dc2626; white-space:nowrap; border-bottom:none !important; }
    .audit-after-row td { background:#f0fdf4; padding:3px 8px !important; font-size:11px; color:#16a34a; font-weight:500; white-space:nowrap; border-top:none !important; }
    .audit-row-label { font-weight:700 !important; font-size:11px !important; min-width:44px; }
    .import-result {
      display:flex; align-items:center; padding:10px 14px; border-radius:6px;
      background:#dcfce7; color:#15803d; font-size:13px; margin-bottom:10px;
    }
    .import-result.import-error { background:#fee2e2; color:#b91c1c; }
    .map-legend-dot { display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:4px; vertical-align:middle; }
    .dialog-overlay {
      position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .dialog-card { background:white; border-radius:12px; padding:24px; width:440px; max-width:90vw; }
    .dialog-card h3 { margin:0 0 8px; font-size:18px; font-weight:600; color:#1e293b; }
  `]
})
export class RegisterDetailComponent implements OnInit, OnDestroy {
  registerId = 0;
  register: any = null;
  items: any[] = [];
  conditions: any[] = [];
  employees: any[] = [];
  registerTeamMembers: any[] = [];
  regDetailNewMember: any = { isExternal: false, employeeId: null, employeeName: '' };
  regDetailAddingMember = false;
  measurementTypes: any[] = [];
  uoms: any[] = [];
  assetStatuses: any[] = [];
  lookupTowns: any[] = [];
  lookupSuburbs: any[] = [];
  lookupWards: any[] = [];
  lookupStreets: any[] = [];
  lookupBuildings: any[] = [];
  lookupFloors: any[] = [];
  lookupRooms: any[] = [];
  lookupOwnerships: any[] = [];
  lookupDivisions: any[] = [];
  lookupDepartments: any[] = [];
  municipalServices: any[] = [];
  loading = true;
  activeTab = 'overview';
  searchTerm = '';

  showGroup: Record<string, boolean> = {
    identity: true,
    physical: false,
    location: false,
    ownership: false,
    financial: true,
    verification: true
  };

  manageSelected = new Set<number>();
  approveSelected = new Set<number>();

  expandedAuditId: number | null = null;
  auditItems: any[] = [];
  auditFromMap: Record<string, string> = {};
  auditToMap: Record<string, string> = {};

  showBackToManageDialog = false;
  backToManageReason = '';
  showApproveDialog = false;

  exportingCsv = false;
  importingCsv = false;
  importResult: any = null;

  mapItems: any[] = [];
  mapStatusFilter = 'All';
  mapStatusOptions = ['All', 'Pending', 'Waiting Approval', 'Approved', 'Verified'];
  mapLoadingItems = false;
  private detailMap: any = null;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.registerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRegister();
    forkJoin({
      conditions: this.api.getAssetConditions(),
      employees: this.api.getEmployees(),
      measurementTypes: this.api.getMeasurementTypes(),
      uoms: this.api.getUnitOfIssues(),
      assetStatuses: this.api.getAssetStatuses(),
      towns: this.api.getVerificationLookupTowns(),
      suburbs: this.api.getVerificationLookupSuburbs(),
      wards: this.api.getVerificationLookupWards(),
      streets: this.api.getVerificationLookupStreets(),
      buildings: this.api.getVerificationLookupBuildings(),
      floors: this.api.getVerificationLookupFloors(),
      rooms: this.api.getVerificationLookupRooms(),
      ownerships: this.api.getVerificationLookupOwnerships(),
      divisions: this.api.getVerificationLookupDivisions(),
      departments: this.api.getVerificationLookupDepartments(),
      municipalServices: this.api.getCidmsMunicipalServices()
    }).subscribe({
      next: function(this: RegisterDetailComponent, res: any) {
        this.conditions = res.conditions;
        this.employees = res.employees;
        this.measurementTypes = res.measurementTypes;
        this.uoms = res.uoms;
        this.assetStatuses = res.assetStatuses;
        this.lookupTowns = res.towns;
        this.lookupSuburbs = res.suburbs;
        this.lookupWards = res.wards;
        this.lookupStreets = res.streets;
        this.lookupBuildings = res.buildings;
        this.lookupFloors = res.floors;
        this.lookupRooms = res.rooms;
        this.lookupOwnerships = res.ownerships;
        this.lookupDivisions = res.divisions;
        this.lookupDepartments = res.departments;
        this.municipalServices = res.municipalServices;
      }.bind(this)
    });
  }

  filteredSuburbs(item: any): any[] {
    if (!item.townId) return [];
    return this.lookupSuburbs.filter(function(s: any) { return s.townId === item.townId; });
  }
  filteredStreets(item: any): any[] {
    if (!item.suburbId) return [];
    return this.lookupStreets.filter(function(s: any) { return s.suburbId === item.suburbId; });
  }
  filteredBuildings(item: any): any[] {
    if (!item.streetId) return [];
    return this.lookupBuildings.filter(function(b: any) { return b.streetId === item.streetId; });
  }
  filteredFloors(item: any): any[] {
    if (!item.buildingId) return [];
    return this.lookupFloors.filter(function(f: any) { return f.buildingId === item.buildingId; });
  }
  filteredRooms(item: any): any[] {
    if (!item.floorId) return [];
    return this.lookupRooms.filter(function(r: any) { return r.floorId === item.floorId; });
  }
  filteredDivisions(item: any): any[] {
    if (!item.municipalDepartmentId) return [];
    var deptId = Number(item.municipalDepartmentId);
    return this.lookupDivisions.filter(function(d: any) { return d.departmentId === deptId; });
  }

  onTownChange(item: any) {
    item._dirty = true;
    item.suburbId = null;
    item.streetId = null;
    item.buildingId = null;
    item.floorId = null;
    item.roomId = null;
  }
  onSuburbChange(item: any) {
    item._dirty = true;
    item.streetId = null;
    item.buildingId = null;
    item.floorId = null;
    item.roomId = null;
  }
  onStreetChange(item: any) {
    item._dirty = true;
    item.buildingId = null;
    item.floorId = null;
    item.roomId = null;
  }
  onBuildingChange(item: any) {
    item._dirty = true;
    item.floorId = null;
    item.roomId = null;
  }
  onFloorChange(item: any) {
    item._dirty = true;
    item.roomId = null;
  }
  onDepartmentChange(item: any) {
    item._dirty = true;
    item.divisionId = null;
  }

  loadRegister() {
    var self = this;
    this.api.getVerificationRegister(this.registerId).subscribe({
      next: function(data: any) {
        self.register = data;
        self.loadItems();
        self.api.getRegisterTeamMembers(self.registerId).subscribe({
          next: function(members: any[]) { self.registerTeamMembers = members; },
          error: function() { self.registerTeamMembers = []; }
        });
      },
      error: function() { self.loading = false; }
    });
  }

  loadRegisterTeamMembers() {
    var self = this;
    this.api.getRegisterTeamMembers(this.registerId).subscribe({
      next: function(members: any[]) { self.registerTeamMembers = members; },
      error: function() { self.registerTeamMembers = []; }
    });
  }

  onRegDetailExternalToggle() {
    this.regDetailNewMember.employeeId = null;
    this.regDetailNewMember.employeeName = '';
  }

  addRegDetailMember() {
    var self = this;
    if (self.regDetailNewMember.isExternal) {
      if (!(self.regDetailNewMember.employeeName || '').trim()) return;
    } else {
      if (!self.regDetailNewMember.employeeId) return;
    }
    self.regDetailAddingMember = true;
    var payload: any = {
      isExternal: self.regDetailNewMember.isExternal ? 1 : 0,
      employeeId: self.regDetailNewMember.isExternal ? null : self.regDetailNewMember.employeeId,
      employeeName: self.regDetailNewMember.isExternal ? self.regDetailNewMember.employeeName.trim() : null
    };
    self.api.addRegisterTeamMember(self.registerId, payload).subscribe({
      next: function() {
        self.regDetailAddingMember = false;
        self.regDetailNewMember = { isExternal: false, employeeId: null, employeeName: '' };
        self.loadRegisterTeamMembers();
      },
      error: function() { self.regDetailAddingMember = false; }
    });
  }

  removeRegDetailMember(member: any) {
    var self = this;
    self.api.removeRegisterTeamMember(self.registerId, member.registerTeamMemberId).subscribe({
      next: function() { self.loadRegisterTeamMembers(); },
      error: function() {}
    });
  }

  loadItems() {
    this.loading = true;
    var params: any = {};
    if (this.activeTab === 'manage') params.tab = 'manage';
    else if (this.activeTab === 'approve') params.tab = 'approve';
    if (this.searchTerm) params.search = this.searchTerm;
    this.api.getVerificationItems(this.registerId, params).subscribe({
      next: function(this: RegisterDetailComponent, data: any[]) {
        this.items = data;
        this.loading = false;
        this.manageSelected.clear();
        this.approveSelected.clear();
      }.bind(this),
      error: function(this: RegisterDetailComponent) { this.loading = false; }.bind(this)
    });
  }

  ngOnDestroy() {
    this.destroyDetailMap();
  }

  switchTab(tab: string) {
    if ((tab === 'manage' || tab === 'approve') && this.register?.isHistory) return;
    this.activeTab = tab;
    this.searchTerm = '';
    if (tab === 'approve') {
      this.showGroup['identity'] = true;
      this.showGroup['physical'] = true;
      this.showGroup['location'] = true;
      this.showGroup['ownership'] = true;
      this.showGroup['financial'] = true;
    }
    if (tab === 'map') {
      this.destroyDetailMap();
      this.loadMapItems();
    } else if (tab === 'team') {
      this.loadRegisterTeamMembers();
    } else {
      this.loadItems();
    }
  }

  exportCsv() {
    this.exportingCsv = true;
    var self = this;
    this.api.exportVerificationCsv(this.registerId).subscribe({
      next: function(blob: Blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'VerificationRegister_' + self.registerId + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        self.exportingCsv = false;
      },
      error: function() {
        alert('Failed to export CSV');
        self.exportingCsv = false;
      }
    });
  }

  triggerManageCsvUpload() {
    var el = document.getElementById('manage-csv-input') as HTMLInputElement;
    if (el) { el.value = ''; el.click(); }
  }

  onManageCsvSelected(event: Event) {
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    this.importingCsv = true;
    this.importResult = null;
    var self = this;
    this.api.importVerificationCsv(this.registerId, file).subscribe({
      next: function(res: any) {
        self.importingCsv = false;
        self.importResult = res;
        self.loadItems();
      },
      error: function(err: any) {
        self.importingCsv = false;
        self.importResult = err.error || { error: 'Import failed' };
      }
    });
  }

  loadMapItems() {
    this.mapLoadingItems = true;
    this.mapItems = [];
    var self = this;
    this.api.getVerificationMapItems(this.registerId, this.mapStatusFilter).subscribe({
      next: function(data: any[]) {
        self.mapItems = data;
        self.mapLoadingItems = false;
        setTimeout(function() { self.initDetailMap(); }, 100);
      },
      error: function() { self.mapLoadingItems = false; }
    });
  }

  private initDetailMap() {
    this.destroyDetailMap();
    var self = this;
    var mapItems = this.mapItems;
    import('leaflet').then(function(leafletModule: any) {
      var L = leafletModule.default || leafletModule;
      var container = document.getElementById('verif-detail-map');
      if (!container) return;
      self.detailMap = L.map(container, { preferCanvas: true }).setView([-31.5, 26.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(self.detailMap);

      if (mapItems.length === 0) return;

      var bounds: any[] = [];
      mapItems.forEach(function(item: any) {
        var lat = parseFloat(item.latitude);
        var lng = parseFloat(item.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        bounds.push([lat, lng]);
        var color = '#6b7280';
        var status = item.displayStatus || '';
        if (status === 'Approved') color = '#16a34a';
        else if (status === 'Waiting Approval') color = '#2563eb';
        else if (status === 'Verified') color = '#d97706';
        var marker = L.circleMarker([lat, lng], {
          radius: 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
        }).addTo(self.detailMap);
        var popupContent = '<div style="min-width:180px">' +
          '<b>' + (item.description || 'Asset') + '</b><br>' +
          '<span style="color:#64748b;font-size:12px">ID: ' + item.assetRegisterItemId + '</span><br>' +
          (item.barcode ? '<span style="color:#64748b;font-size:12px">Barcode: ' + item.barcode + '</span><br>' : '') +
          '<span style="font-size:12px;font-weight:600;color:' + color + '">' + (status || 'Pending') + '</span>' +
          (item.conditionDesc ? '<br><span style="font-size:12px;color:#64748b">Condition: ' + item.conditionDesc + '</span>' : '') +
          '</div>';
        marker.bindPopup(popupContent);
      });
      if (bounds.length > 0) {
        self.detailMap.fitBounds(bounds, { padding: [30, 30] });
      }
    });
  }

  private destroyDetailMap() {
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }
  }

  toggleGroup(group: string) {
    this.showGroup[group] = !this.showGroup[group];
  }

  get overviewColspan(): number {
    var c = 3;
    if (this.showGroup['identity']) c += 11;
    if (this.showGroup['physical']) c += 15;
    if (this.showGroup['location']) c += 15;
    if (this.showGroup['ownership']) c += 6;
    if (this.showGroup['financial']) c += 2;
    if (this.showGroup['verification']) c += 9;
    return c;
  }

  get manageColspan(): number {
    var c = 10;
    if (this.showGroup['identity']) c += 11;
    if (this.showGroup['physical']) c += 15;
    if (this.showGroup['location']) c += 15;
    if (this.showGroup['ownership']) c += 6;
    if (this.showGroup['financial']) c += 2;
    return c;
  }

  get approveColspan(): number {
    var c = 13;
    if (this.showGroup['identity']) c += 11;
    if (this.showGroup['physical']) c += 15;
    if (this.showGroup['location']) c += 15;
    if (this.showGroup['ownership']) c += 6;
    if (this.showGroup['financial']) c += 2;
    return c;
  }

  saveItem(item: any) {
    var data: any = {
      tempVerificationDate: item.tempVerificationDate || null,
      verificationComments: item.verificationComments || null,
      assetFound: item.assetFound,
      keepOnRegisterDispose: item.keepOnRegisterDispose || null,
      assetConditionId: item.assetConditionId,
      latitude: item.latitude,
      longitude: item.longitude,
      verificationDoneBy: item.verificationDoneBy,
      measurementTypeId: item.measurementTypeId,
      uom: item.uom,
      dim1: item.dim1,
      dim2: item.dim2,
      dim3: item.dim3,
      quantity: item.quantity,
      diameter: item.diameter,
      capacity: item.capacity,
      assetStatusId: item.assetStatusId,
      townId: item.townId,
      suburbId: item.suburbId,
      wardId: item.wardId,
      streetId: item.streetId,
      buildingId: item.buildingId,
      floorId: item.floorId,
      roomId: item.roomId,
      zoningId: item.zoningId,
      erfNumber: item.erfNumber,
      erfSizeM2: item.erfSizeM2,
      portionNumber: item.portionNumber,
      unitNumber: item.unitNumber,
      floorArea: item.floorArea,
      municipalDepartmentId: item.municipalDepartmentId,
      divisionId: item.divisionId,
      custodianId: item.custodianId,
      custodianIdNumber: item.custodianIdNumber,
      assetOwnershipId: item.assetOwnershipId,
      basicMunicipalityService: item.basicMunicipalityService
    };
    this.api.updateVerificationItem(item.verificationItemId, data).subscribe({
      next: function(this: RegisterDetailComponent, updated: any) {
        Object.assign(item, updated);
        item._dirty = false;
      }.bind(this),
      error: function() { alert('Failed to save changes'); }
    });
  }

  submitSelected() {
    var ids = Array.from(this.manageSelected);
    if (!confirm('Submit ' + ids.length + ' item(s) for approval?')) return;
    this.api.submitVerificationItems(ids).subscribe({
      next: function(this: RegisterDetailComponent) { this.loadItems(); this.loadRegister(); }.bind(this)
    });
  }

  allManageSelected(): boolean { return this.items.length > 0 && this.manageSelected.size === this.items.length; }
  someManageSelected(): boolean { return this.manageSelected.size > 0 && this.manageSelected.size < this.items.length; }
  toggleManageAll(event: any) {
    if (event.checked) { this.manageSelected = new Set(this.items.map(function(i: any) { return i.verificationItemId; })); }
    else { this.manageSelected.clear(); }
  }
  toggleManageItem(id: number) {
    if (this.manageSelected.has(id)) { this.manageSelected.delete(id); } else { this.manageSelected.add(id); }
  }

  allApproveSelected(): boolean { return this.items.length > 0 && this.approveSelected.size === this.items.length; }
  someApproveSelected(): boolean { return this.approveSelected.size > 0 && this.approveSelected.size < this.items.length; }
  toggleApproveAll(event: any) {
    if (event.checked) { this.approveSelected = new Set(this.items.map(function(i: any) { return i.verificationItemId; })); }
    else { this.approveSelected.clear(); }
  }
  toggleApproveItem(id: number) {
    if (this.approveSelected.has(id)) { this.approveSelected.delete(id); } else { this.approveSelected.add(id); }
  }

  approveSelected_fn() {
    this.showApproveDialog = true;
  }

  confirmApprove() {
    var ids = Array.from(this.approveSelected);
    this.api.approveVerificationItems(ids).subscribe({
      next: function(this: RegisterDetailComponent) {
        this.showApproveDialog = false;
        this.loadItems();
        this.loadRegister();
      }.bind(this),
      error: function(this: RegisterDetailComponent, err: any) {
        this.showApproveDialog = false;
        this.snackBar.open('Approval failed: ' + (err?.error?.error || 'Unknown error'), 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  backToManage() {
    this.showBackToManageDialog = true;
    this.backToManageReason = '';
  }

  confirmBackToManage() {
    var ids = Array.from(this.approveSelected);
    this.api.backToManageVerificationItems({ itemIds: ids, reason: this.backToManageReason }).subscribe({
      next: function(this: RegisterDetailComponent) {
        this.showBackToManageDialog = false;
        this.loadItems();
        this.loadRegister();
      }.bind(this)
    });
  }

  moveToHistory() {
    if (!confirm('Move this register to history? This will disable the Manage and Approval tabs.')) return;
    this.api.moveVerificationToHistory(this.registerId).subscribe({
      next: function(this: RegisterDetailComponent) { this.loadRegister(); }.bind(this)
    });
  }

  toggleAudit(item: any) {
    if (this.expandedAuditId === item.verificationItemId) {
      this.expandedAuditId = null;
      this.auditItems = [];
      this.auditFromMap = {};
      this.auditToMap = {};
      return;
    }
    this.expandedAuditId = item.verificationItemId;
    this.auditItems = [];
    this.auditFromMap = {};
    this.auditToMap = {};
    this.api.getVerificationAuditTrail(item.verificationItemId).subscribe({
      next: function(this: RegisterDetailComponent, data: any[]) {
        this.auditItems = data;
        this.buildAuditMaps(data);
      }.bind(this)
    });
  }

  buildAuditMaps(items: any[]) {
    this.auditFromMap = {};
    this.auditToMap = {};
    for (var i = 0; i < items.length; i++) {
      var a = items[i];
      this.auditFromMap[a.fieldName] = this.resolveAuditValue(a.fieldName, a.oldValue);
      if (!(a.fieldName in this.auditToMap)) {
        this.auditToMap[a.fieldName] = this.resolveAuditValue(a.fieldName, a.newValue);
      }
    }
  }

  getFlagClass(flag: string | null): string {
    if (!flag) return 'flag-not-started';
    if (flag === 'Submitted for Approval') return 'flag-submitted';
    if (flag === 'Approved') return 'flag-approved';
    if (flag === 'Revisit – Not Approved') return 'flag-revisit';
    if (flag === 'Revisited') return 'flag-revisited';
    return 'flag-not-started';
  }

  formatCurrency(val: any): string {
    if (val == null) return 'R 0.00';
    return 'R ' + Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateInput(d: string): string {
    if (!d) return '';
    var date = new Date(d);
    return date.toISOString().split('T')[0];
  }

  formatDateTime(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
  }

  resolveAuditValue(fieldName: string, rawValue: string | null): string {
    if (!rawValue || rawValue === '') return '(empty)';
    var id = Number(rawValue);
    var match: any;
    if (fieldName === 'AssetCondition_ID') {
      match = this.conditions.find(function(c: any) { return c.assetCondition_ID === id; });
      return match ? match.assetConditionDesc : '(unknown)';
    }
    if (fieldName === 'AssetStatus_ID') {
      match = this.assetStatuses.find(function(s: any) { return s.assetStatus_ID === id; });
      return match ? match.assetStatusDesc : '(unknown)';
    }
    if (fieldName === 'Town_ID') {
      match = this.lookupTowns.find(function(t: any) { return t.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'SuburbID') {
      match = this.lookupSuburbs.find(function(s: any) { return s.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'Ward_ID') {
      match = this.lookupWards.find(function(w: any) { return w.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'Street_ID') {
      match = this.lookupStreets.find(function(s: any) { return s.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'Building_ID') {
      match = this.lookupBuildings.find(function(b: any) { return b.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'FloorID') {
      match = this.lookupFloors.find(function(f: any) { return f.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'Room_ID') {
      match = this.lookupRooms.find(function(r: any) { return r.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'MeasurementType_ID') {
      match = this.measurementTypes.find(function(mt: any) { return mt.assetConfig_MeasurementType_ID === id; });
      return match ? match.name : '(unknown)';
    }
    if (fieldName === 'UoM') {
      match = this.uoms.find(function(u: any) { return u.unitOfIssueId === id; });
      return match ? match.unitOfIssueDesc : '(unknown)';
    }
    if (fieldName === 'MunicipalDepartment_ID') {
      match = this.lookupDepartments.find(function(d: any) { return String(d.id) === rawValue; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'DivisionID') {
      match = this.lookupDivisions.find(function(d: any) { return d.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'Custodian_ID' || fieldName === 'VerificationDoneBy') {
      match = this.employees.find(function(e: any) { return e.employeeId === id; });
      return match ? (match.surname + ', ' + match.firstName) : '(unknown)';
    }
    if (fieldName === 'AssetOwnership_ID') {
      match = this.lookupOwnerships.find(function(o: any) { return o.id === id; });
      return match ? match.description : '(unknown)';
    }
    if (fieldName === 'BasicMunicipalityService') {
      match = this.municipalServices.find(function(ms: any) { return ms.assetMunicipalServicesID === id; });
      return match ? match.assetMunicipalServicesDesc : '(unknown)';
    }
    if (fieldName === 'Asset_Found') {
      return rawValue || '--';
    }
    if (fieldName === 'Temp_VerificationDate') {
      var parsedDate = new Date(rawValue);
      return isNaN(parsedDate.getTime()) ? rawValue : parsedDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return rawValue;
  }
}

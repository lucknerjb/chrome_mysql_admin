/*
 * Copyright (c) 2014 Yoichiro Tanaka. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

chromeMyAdmin.controller("DatabasePanelController", ["$scope", "mySQLClientService", "modeService", "$timeout", "UIConstants", function($scope, mySQLClientService, modeService, $timeout, UIConstants) {
    "use strict";

    var autoUpdatePromise = null;

    var _isDatabasePanelVisible = function() {
        return mySQLClientService.isConnected() &&
            modeService.getMode() === "database";
    };

    var initializeProcessListGrid = function() {
        resetProcessListGrid();
        $scope.processListGrid = {
            data: "processListData",
            columnDefs: "processListColumnDefs",
            enableColumnResize: true,
            enableSorting: false,
            headerRowHeight: UIConstants.GRID_ROW_HEIGHT,
            rowHeight: UIConstants.GRID_ROW_HEIGHT
        };
    };

    var resetProcessListGrid = function() {
        $scope.processListColumnDefs = [];
        $scope.processListData = [];
    };

    var assignWindowResizeEventHandler = function() {
        $(window).resize(function(evt) {
            adjustProcessListHeight();
        });
    };

    var adjustProcessListHeight = function() {
        $("#processListGrid").height(
            $(window).height() -
                UIConstants.NAVBAR_HEIGHT -
                UIConstants.FOOTER_HEIGHT - 50);
    };

    var onModeChanged = function(mode) {
        if (mode === "database") {
            loadProcessList();
        } else {
            stopAutoUpdate();
        }
    };

    var stopAutoUpdate = function() {
        if (autoUpdatePromise) {
            $timeout.cancel(autoUpdatePromise);
            autoUpdatePromise = null;
        }
    };

    var onConnectionChanged = function() {
        if (!mySQLClientService.isConnected()) {
            stopAutoUpdate();
        }
    };

    var loadProcessList = function() {
        mySQLClientService.getStatistics().then(function(statistics) {
            $scope.statistics = statistics;
            return mySQLClientService.query("SHOW PROCESSLIST");
        }).then(function(result) {
            if (result.hasResultsetRows) {
                $scope.safeApply(function() {
                    updateProcessListColumnDefs(result.columnDefinitions);
                    updateProcessList(result.columnDefinitions, result.resultsetRows);
                    autoUpdatePromise = $timeout(
                        loadProcessList, UIConstants.DATABASE_INFO_AUTO_UPDATE_SPAN);
                });
            } else {
                $scope.fatalErrorOccurred("Retrieving process list failed.");
            }
        }, function(reason) {
            $scope.fatalErrorOccurred(reason);
        });
    };

    var updateProcessListColumnDefs = function(columnDefinitions) {
        var columnDefs = [];
        angular.forEach(columnDefinitions, function(columnDefinition) {
            this.push({
                field: columnDefinition.name,
                displayName: columnDefinition.name,
                width: Math.min(
                    Number(columnDefinition.columnLength) * UIConstants.GRID_COLUMN_FONT_SIZE,
                    UIConstants.GRID_COLUMN_MAX_WIDTH)
            });
        }, columnDefs);
        $scope.processListColumnDefs = columnDefs;
    };

    var updateProcessList = function(columnDefinitions, resultsetRows) {
        var rows = [];
        angular.forEach(resultsetRows, function(resultsetRow) {
            var values = resultsetRow.values;
            var row = {};
            angular.forEach(columnDefinitions, function(columnDefinition, index) {
                row[columnDefinition.name] = values[index];
            });
            rows.push(row);
        });
        $scope.processListData = rows;
    };

    $scope.initialize = function() {
        $scope.$on("modeChanged", function(event, mode) {
            onModeChanged(mode);
        });
        $scope.$on("connectionChanged", function(event, data) {
            onConnectionChanged();
        });
        initializeProcessListGrid();
        assignWindowResizeEventHandler();
        adjustProcessListHeight();
    };

    $scope.isDatabasePanelVisible = function() {
        return _isDatabasePanelVisible();
    };

}]);
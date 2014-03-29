"use strict";

chromeMyAdmin.controller("LoginFormController", ["$scope", "$timeout", "mySQLClientService", "favoriteService", function($scope, $timeout, mySQLClientService, favoriteService) {

    // Private methods

    var showErrorMessage = function(message) {
        $scope.safeApply(function() {
            $scope.errorMessage = message;
        });
    };

    var hideMessage = function() {
        $scope.safeApply(function() {
            $scope.successMessage = "";
            $scope.errorMessage = "";
        });
    };

    var showSuccessMessage = function(message) {
        $scope.safeApply(function() {
            $scope.successMessage = message;
        });
    };

    var onConnected = function() {
        $scope.safeApply(function() {
            $scope.notifyConnectionChanged();
        });
    };

    var assignEventHandlers = function() {
        $scope.$on("favoriteSelected", function(event, favorite) {
            $scope.safeApply(function() {
                $scope.name = favorite.name;
                $scope.hostName = favorite.hostName;
                $scope.portNumber = favorite.port;
                $scope.userName = favorite.userName;
                $scope.password = favorite.password;
            });
        });
    };

    // Public methods

    $scope.initialize = function() {
        $scope.successMessage = "";
        $scope.errorMessage = "";
        assignEventHandlers();
    };

    $scope.connect = function() {
        hideMessage();
        mySQLClientService.login(
            $scope.hostName,
            Number($scope.portNumber),
            $scope.userName,
            $scope.password
        ).then(function(initialHandshakeRequest) {
            onConnected();
        }, function(reason) {
            showErrorMessage("Connection failed: " + reason);
        });
    };

    $scope.doTestConnection = function() {
        hideMessage();
        mySQLClientService.login(
            $scope.hostName,
            Number($scope.portNumber),
            $scope.userName,
            $scope.password
        ).then(function(initialHandshakeRequest) {
            showSuccessMessage("Connection was successfully.");
            mySQLClientService.logout();
        }, function(reason) {
            showErrorMessage("Connection failed: " + reason);
        });
    };

    $scope.isErrorMessageVisible = function() {
        return $scope.errorMessage.length > 0;
    };

    $scope.isSuccessMessageVisible = function() {
        return $scope.successMessage.length > 0;
    };

    $scope.isLoginFormVisible = function() {
        return !mySQLClientService.isConnected();
    };

    $scope.addFavorite = function() {
        var name = $scope.name || $scope.hostName;
        if (name) {
            favoriteService.set(name, $scope.hostName, Number($scope.portNumber), $scope.userName, $scope.password);
        }
    };

}]);
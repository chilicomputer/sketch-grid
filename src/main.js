define([
    'angular',
    'app/view/pannel',
    'app/view/painter',
    'app/view/ui'
], function(
    angular,
    pannel,
    painter,
    ui
){
'use strict';

    var main = angular.module( 'app.main', []);

    angular.bootstrap(
        document,
        ['app.main', 'app.view.pannel', 'app.view.painter', 'app.view.ui'],
        { strictDi: true }
    );

});
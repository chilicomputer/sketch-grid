define([
    'angular',
    'app/utils'
], function(
    angular,
    utils
){
'use strict';
    var exports = {};

    var viewPannel = angular.module( 'app.view.pannel', ['app.utils'] );

    /* menu bar controller begins */

    var pannelCtrl = function( $scope, $rootScope, $timeout, $$fullscreen ) {
        // local variables
        var _p;
        var onfullscreen = function() {
            if ( $$fullscreen.element() ) return;
            $scope.fullscreen = false;
            $scope.$digest();
        };

        // init scope
        $scope.isMenuActive = 1;
        $scope.canEdit      = false;
        $scope.isFsActive   = true;
        $scope.isCpActive   = false;
        $scope.ioBusy       = false;
        $scope.isInfoOpen   = false;
        $scope.tab          = 'file';

        $scope.editType = '';
        $scope.imgSrc = {
            tmp: '',
            val: ''
        };
        $scope.color = {
            r: 0,
            g: 0,
            b: 0,
            a: 0.5
        };

        $scope.fullscreen = false;

        $scope.toggleMenu = function() {

            $scope.isMenuActive = $scope.isMenuActive <=0 ? 1 : 0;

            if ( $scope.isMenuActive == 0 ) {

                _p = $timeout( function() {
                    $scope.isMenuActive = -1;
                }, 500 );
            }

            else {

                $timeout.cancel( _p );
            }

            // animate hide the modal layers
            if ( $scope.isMenuActive<=0 ) {

                $scope.isFsActive = false;
                $scope.isCpActive = false;
            }
        };

        $scope.toggleInfo = function() {
            $scope.isInfoOpen = !$scope.isInfoOpen;
        };

        $scope.showFs = function() {

            if ( $scope.isFsActive ) return;

            $scope.isFsActive = true;
            $scope.isCpActive = false;
        };

        $scope.hideFs = function() {

            if ( !$scope.isFsActive ) return;
            $scope.isFsActive = false;
        };

        $scope.showCp = function() {

            if ( $scope.isCpActive ) return;

            $scope.isCpActive = true;
            $scope.isFsActive = false;
        };

        $scope.hideCp = function() {

            if ( !$scope.isCpActive ) return;
            $scope.isCpActive = false;
        };

        $scope.toggleFullscreen = function() {

            if ( !$scope.canEdit ) return;

            $scope.fullscreen = !$scope.fullscreen;
        };

        $scope.switchEditType = function( type ) {

            if ( !$scope.canEdit ) return;

            $scope.editType = ( type === $scope.editType ) ? false : type;
        };

        $scope.reset = function() {

            if ( !$scope.canEdit ) return;

            $rootScope.$broadcast( 'reset' );
        };

        $scope.clear = function() {

            if ( !$scope.canEdit ) return;

            $scope.imgSrc.val = '';
            $scope.editType = '';
            $scope.canEdit = false;
            $scope.isCpActive = false;

            $rootScope.$broadcast( 'clean' );
        };

        $scope.useTmp = function() {

            // assign the tmp to value and clear tmp
            $scope.imgSrc.val = $scope.imgSrc.tmp;
        };

        // init watchers

        $scope.$watch( 'imgSrc.val', function( src ) {

            src && $rootScope.$broadcast( 'imgSrcChanged', { src: src } );
        });

        $scope.$watch( 'editType', function( type, old ) {

            $scope.canEdit && $rootScope.$broadcast( 'editTypeChanged', { type: type } );
        });

        $scope.$watch( 'fullscreen', function( flag, old ) {

            if ( flag ) {

                $$fullscreen.request( document.documentElement );
            }

            else if ( $$fullscreen.element() ) {

                $$fullscreen.cancel();
            }
        });

        $scope.$watch( 'color', function( color, old ) {
            // normalize to [0,255]
            color = {
                r: ~~(color.r*255),
                g: ~~(color.g*255),
                b: ~~(color.b*255),
                a: color.a
            };
            $rootScope.$broadcast( 'colorChanged', { color: color } );
        }, true );

        // add broadcast listeners

        $scope.$on( 'loading', function( e, loading ) {

            $scope.ioBusy = !!loading;
        });

        $scope.$on( 'importend', function( e, error ) {

            // reset the imgSrc
            $scope.imgSrc.val = '';

            // reset the switch
            $scope.editType = '';

            if ( !error ) {

                $scope.canEdit    = true;
                $scope.isFsActive = false;
                $scope.imgSrc.tmp = '';
                $scope.color = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 0.5
                };
            }
            else {

                $scope.canEdit = false;
                // alert
                $rootScope.$broadcast( 'notify',
                    { msg:'该地址未引用图片，或者该图片不是公开的，请重新输入。', type:'error' }
                );
            }
        });

        // add dom listeners
        $$fullscreen.listen( onfullscreen );
    };

    pannelCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$$fullscreen' ];

    /* register factories to module */

    viewPannel.controller( 'pannelCtrl', pannelCtrl );

    /* return amd exports */

    exports.viewPannel = viewPannel;

    return exports;
});
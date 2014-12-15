define([
    'angular',
    'app/utils'
], function(
    angular,
    utils
){
'use strict';
    var exports = {};

    var viewUi = angular.module( 'app.view.ui', ['app.utils'] );

    /* ui directives begin */

    var uiModal = function( $$transitionEvent, $$sizeOf, $$uid ) {

        var template = ''+
            '<div class="modal-menu" style="display:none;">'+
                '<div class="modal-close" ng-click="hide()">'+
                    '<span class="ico cancel"></span>'+
                '</div>'+
                '<div class="modal-content">'+
                    '<ng-transclude></ng-transclude>'+
                '</div>'+
            '</div>';

        var scope = {
            hide: '&',
            flag: '='
        };

        var link = function( $scope, $element, $attrs ) {

            if ( !$attrs['flag'] ) return;

            var $boxouter = $element.children();
            var $boxinner = $element.find( 'ng-transclude' );
            var $content  = $boxinner.children();
            var size      = $$sizeOf( $content );

            // place the modal to the page's center
            $boxouter.css( 'marginLeft', -size.width/2 + 'px' );
            $boxouter.css( 'marginTop', -size.height/2 + 'px' );
            // make sure the content be visible
            $content[0].style.display = 'block';

            $scope.$watch( 'flag', function( actived, old ) {

                if ( !actived && actived === old ) return;

                if ( !actived ) {

                    $boxouter.addClass( 'up' );
                    $boxouter.one( $$transitionEvent, function() {

                        $boxouter[0].style.display = 'none';
                        $boxouter.removeClass( 'up' );
                    });
                }

                else {

                    $boxouter.addClass( 'down' );
                    $boxouter[0].style.display = '';

                    setTimeout( function() {
                        $boxouter.removeClass( 'down' );
                    }, 50);
                }
            });
        };

        return {
            restrict: 'E',
            transclude: true,
            template: template,
            scope: scope,
            link: link
        };
    };

    uiModal.$inject = [ '$$transitionEvent', '$$sizeOf', '$$uid' ];

    var uiFileReader = function( $parse ) {

        var link = function( $scope, $element, $attrs ) {

            var getter = $parse( $attrs['appUiFileReader'] );
            var setter = getter.assign;

            $element.bind( 'change', function() {

                var file = $element[0].files[0];
                var fileReader = new FileReader();

                fileReader.readAsDataURL( file );
                fileReader.onload = function( e ) {

                    setter( $scope, e.target.result );
                    $element[0].value = '';

                    // fuck
                    if ( $scope.$$transcluded ) {
                        $scope.$parent.$parent.$digest();
                    }
                    else {
                        $scope.$digest();
                    }
                };
            });
        };

        return {
            restrict: 'EA',
            link: link
        };
    };

    uiFileReader.$inject = [ '$parse' ];

    var uiSlidePicker = function( $parse, $$modernVendor, $$sizeOf ) {

        var _transform = $$modernVendor ? $$modernVendor + 'Transform' : 'transform';
        var _translate = function( x ) {
            return 'translate3d(' + x + 'px,0px,0px)';
        };

        var template = ''+
            '<div class="slide-pick-container" style="margin:0.5em;height:1em;position:relative;padding-top:0.35em;">'+
                '<div class="btn" style="width:1em;height:1em;background:#eee;border:0.25em solid #666;border-radius:100%;margin-left:-0.5em;margin-top:-0.5em;position:absolute;top:50%;"></div>'+
                '<div class="line" style="height:0.3em;background:#666;"></div>'+
            '</div>';

        var link = function( $scope, $element, $attrs ) {

            var $container = $element.children();
            var btn        = $container.children()[0];
            var line       = $container.children()[1];

            var model  = $attrs['model']
            var getter = $parse( model );
            var setter = getter.assign;

            var btnColor = $attrs['colorBtn'];

            var initPos   = null;
            var curPos    = null;
            var minPos    = null;
            var maxPos    = null;
            var lastPoint = null;

            var docMove = function( e ) {

                if ( !lastPoint ) return;
                e.preventDefault();

                var target;

                curPos += e.pageX - lastPoint;
                target = Math.max( minPos, Math.min( maxPos, curPos ) );
                btn.style[ _transform ] = _translate( target );
                lastPoint = e.pageX;

                setter( $scope, ( target - minPos )/( maxPos - minPos ) );

                // fuck
                if ( $scope.$$transcluded ) {
                    $scope.$parent.$parent.$digest();
                }
                else {
                    $scope.$digest();
                }
            };

            var docUp = function( e ) {

                lastPoint = null;
                btn.style.cursor = '-' + $$modernVendor + '-grab';

                document.body.removeEventListener( 'mousemove', docMove );
                document.body.removeEventListener( 'mouseup', docUp );
            };

            btn.style.background = btnColor;
            btn.style.cursor = '-' + $$modernVendor + '-grab';

            btn.addEventListener( 'mousedown', function( e ) {

                e.preventDefault();

                btn.style.cursor = '-' + $$modernVendor + '-grabbing';
                lastPoint = e.pageX;

                document.body.addEventListener( 'mousemove', docMove );
                document.body.addEventListener( 'mouseup', docUp );


                if ( !curPos ) {

                    curPos    = 0;
                    maxPos    = line.offsetWidth*( 1 - initPos );
                    minPos    = -line.offsetWidth*initPos;

                    btn.style[ _transform ] = _translate( curPos );
                }
            });

            $scope.$watch( model, function() {
                // when the picker is on a operation,
                // the btn's position should not be synced with the model
                if ( lastPoint ) return;
                // reset the picker's status
                initPos = getter( $scope );
                btn.style.left = initPos*100 + '%';
                btn.style[ _transform ] = '';
                curPos = null;
            });
        };

        return {
            restrict: 'E',
            link: link,
            template: template
        };
    };

    uiSlidePicker.$inject = [ '$parse', '$$modernVendor', '$$sizeOf' ];

    var uiNotify = function( $$transitionEvent ) {

        var template = ''+
        '<div class="msg-box" ng-show="show">'+
            '<div class="msg-content {{type}}">'+
                '<span class="txt">{{msg}}</span>'+
            '</div>'+
        '</div>';

        var link = function( $scope, $element, $attrs ) {

            var $content = angular.element( $element[0].querySelector( '.msg-content' ) );
            $scope.type = '';
            $scope.msg = '';
            $scope.show = false;
            $scope.timer = null;

            $scope.setTimer = function() {

                $scope.timer = setTimeout( function() {

                    $scope.type = $scope.type + ' pulse-out';
                    $scope.$digest();
                    $content.one( $$transitionEvent, function() {

                        $scope.show = false;
                        $scope.type = '';
                        $scope.msg = '';
                        $scope.$digest();
                    });
                }, 5000 );
            };

            $scope.$on( 'notify', function( e, data ) {

                if ( !data.msg ) return;

                clearTimeout( $scope.timer );

                $scope.type = ( data.type || '' ) + ' pulse-in';
                $scope.show = true;
                $scope.msg = data.msg;

                $scope.setTimer();
            });
        };

        return {
            restrict: 'E',
            scope: true,
            link: link,
            template: template
        };
    };

    uiNotify.$inject = [ '$$transitionEvent' ];

    viewUi.directive( 'appUiModal', uiModal );
    viewUi.directive( 'appUiFileReader', uiFileReader );
    viewUi.directive( 'appUiSlidePicker', uiSlidePicker );
    viewUi.directive( 'appUiNotify', uiNotify );

    exports.viewUi = viewUi;

    return exports;
});
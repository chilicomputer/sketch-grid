define([
    'angular'
], function(
    angular
){
'use strict';
    var exports = {};
    var utils = angular.module( 'app.utils', [] );

    utils.factory( '$$uid', [function() {
        return function() {
            return Math.random().toString(16).substring(2,10);
        };
    }]);

    utils.factory( '$$modernVendor', [function() {

        var vendor = [ '', 'o', 'ms', 'moz', 'webkit' ];
        var el = document.createElement( 'div' );
        var len,v,test;

        for ( len = vendor.length; len--; ) {

            v = vendor [len];

            test = v ? v + 'Transition' : 'transition';

            if ( el.style.hasOwnProperty( test ) ) {
                return v;
            }
        }
        return null;
    }]);

    utils.factory( '$$transitionEvent', [function() {

        var eventName = (function () {

            var el = document.createElement( 'div' );

            var transEndEventNames = {
                'transition':       'transitionend',
                'WebkitTransition': 'webkitTransitionEnd',
                'MozTransition':    'transitionend',
                'OTransition':      'oTransitionEnd otransitionend'
            };

            for ( var name in transEndEventNames ) {

                if ( el.style[ name ] !== undefined ) {

                    return transEndEventNames[ name ];
                }
            }

            return undefined;
        })();

        return eventName;
    }]);

    utils.factory( '$$requestAnimationFrame', [ '$$modernVendor', function( v ) {

        if ( v !== null ) {

            return window[ v ? v + 'RequestAnimationFrame' : 'requestAnimationFrame' ];
        }

        var lastTime = 0;

        return function( render ) {

            var currentTime = new Date().getTime();

            var timeToWait = Math.max( 0, 16 - ( currentTime - lastTime ) );

            var timer = setTimeout( function() {

                render.call( null, currentTime + timeToWait );

            }, timeToWait);

            lastTime = currentTime + timeToWait;

            return timer;
        };
    }]);

    utils.factory( '$$cancelAnimationFrame', [ '$$modernVendor', function( v ) {

        if ( v!==null ) {

            return window[ v ? v + 'CancelAnimationFrame' : 'cancelAnimationFrame' ];
        }

        return function( timer ) {

            clearTimeout( timer );
        };
    }]);

    utils.factory( '$$fullscreen', [ '$$modernVendor', function( v ) {

        var request = function( el ) {

            if ( v!==null ) {

                el[ v ? v + 'RequestFullScreen' : 'requestFullScreen' ]();
            }

            else throw 'requestFullScreen not supported';
        };

        var cancel = function() {

            if ( v!==null ) {

                document[ v ? v + 'CancelFullScreen' : 'cancelFullScreen' ]();
            }

            else throw 'cancelFullScreen not supported';
        };

        var element = function() {

            if ( v!==null ) {

                return document[ v ? v + 'FullscreenElement' : 'fullscreenElement' ];
            }

            else throw 'fullscreenElement not supported';
        };

        var listen = function( handler ) {

            if ( v===null ) throw 'fullscreen not supported';

            document.addEventListener( v + 'fullscreenchange', handler );
        };

        return {
            request: request,
            cancel:  cancel,
            element: element,
            listen:  listen
        };
    }]);

    utils.factory( '$$merge', [ function() {

        return function() {
            return angular.extend.apply( null, Array.prototype.slice.call( arguments ) );
        };
    }]);

    utils.factory( '$$sizeOf', [ function() {

        var hiddenDiv = document.createElement( 'div' );
        var ishidden  = function( el ) {
            if ( el.style.display == 'none' || window.getComputedStyle( el ).display == 'none' ) {
                return true;
            }
            return false;
        };

        hiddenDiv.style.cssText = 'position:absolute;left:-10000px;box-sizing:border-box;';

        return function( el ) {

            var w,h;
            var originDisplay;
            var parent;

            el = el.hasOwnProperty( '0' ) ? el[0] : el;

            if ( !ishidden( el ) ) {
                return {
                    width:  el.offsetWidth,
                    height: el.offsetHeight
                };
            }

            originDisplay = el.style.display ? el.style.display : '';
            parent = el.parentNode;

            document.body.appendChild( hiddenDiv );
            hiddenDiv.appendChild( el );

            el.style.display = 'block';
            w = el.offsetWidth;
            h = el.offsetHeight;

            parent.appendChild( el );
            document.body.removeChild( hiddenDiv );
            el.style.display = originDisplay;

            return {
                width:  w,
                height: h
            };
        };
    }]);

    return exports;
});
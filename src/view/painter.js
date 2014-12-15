define([
    'angular',
    'app/utils'
], function(
    angular,
    utils
){
'use strict';

    var exports = {};

    /* graphic operators */

    var clipPolygon = function( polygon, clipper ) {

        var wMin = clipPolygon._getBoundary( clipper, function(i) {return i > 0 ;} );
        var wMax = clipPolygon._getBoundary( clipper, function(i) {return i < 0 ;} );

        return clipPolygon._clip( polygon, clipPolygon.BOUNDARY_LEFT, wMin, wMax );
    };

    clipPolygon.BOUNDARY_LEFT   = 1;
    clipPolygon.BOUNDARY_RIGHT  = 2;
    clipPolygon.BOUNDARY_BOTTOM = 3;
    clipPolygon.BOUNDARY_TOP    = 4;

    clipPolygon._getBoundary = function( clipperPoints, comp ) {

        if ( clipperPoints.length != 4 ) throw 'params error: illegal clipper points';

        var i = 4;
        var x,y;
        while ( i-- ) {

            if ( x == undefined || comp( x - clipperPoints[i][0] ) ) {

                x = clipperPoints[i][0];
            }

            if ( y == undefined || comp( y - clipperPoints[i][1] ) ) {

                y = clipperPoints[i][1];
            }
        }

        return [x, y];
    };

    clipPolygon._ifInside = function( point, boundary, wMin, wMax ) {

        if ( boundary == clipPolygon.BOUNDARY_LEFT && point[0] < wMin[0] ) return false;
        if ( boundary == clipPolygon.BOUNDARY_RIGHT && point[0] > wMax[0] ) return false;
        if ( boundary == clipPolygon.BOUNDARY_BOTTOM && point[1] < wMin[1] ) return false;
        if ( boundary == clipPolygon.BOUNDARY_TOP && point[1] > wMax[1] ) return false;
        return true;
    };

    clipPolygon._intersect = function( pointA, pointB, boundary, wMin, wMax ) {

        var ipoint = [];
        var m = 0;

        if ( pointA[0] != pointB[0] ) {

            m = parseFloat( pointA[1] - pointB[1] ) / parseFloat( pointA[0] - pointB[0] );
        }

        if ( boundary == clipPolygon.BOUNDARY_LEFT ) {

            ipoint[0] = wMin[0];
            ipoint[1] = pointB[1] + ( wMin[0] - pointB[0] )*m;
            return ipoint;
        }

        if ( boundary == clipPolygon.BOUNDARY_RIGHT ) {

            ipoint[0] = wMax[0];
            ipoint[1] = pointB[1] + ( wMax[0] - pointB[0] )*m;
            return ipoint;
        }

        if ( boundary == clipPolygon.BOUNDARY_BOTTOM ) {

            if ( pointA[0] != pointB[0] ) ipoint[0] = pointB[0] + ( wMin[1] - pointB[1] )/m;
            else ipoint[0] = pointB[0];
            ipoint[1] = wMin[1];
            return ipoint;
        }

        if ( boundary == clipPolygon.BOUNDARY_TOP ) {

            if ( pointA[0] != pointB[0] ) ipoint[0] = pointB[0] + ( wMax[1] - pointB[1] )/m;
            else ipoint[0] = pointB[0];
            ipoint[1] = wMax[1];
            return ipoint;
        }

        return false;
    };

    clipPolygon._assemble = function( points ) {

        var newPoints = [];
        var last,i,j;

        for ( i =0; i < points.length; i++ ) {

            var last = newPoints.length - 1;
            if ( last < 0 ) newPoints.push( points[i] );
            else if ( points[i][0]==newPoints[last][0] && points[i][1]==newPoints[last][1] ) continue;
            else if ( i == points.legnth-1 && points[i][0]==newPoints[0][0] && points[i][1]==newPoints[0][1] )
                continue;
            else newPoints.push( points[i] );
        }

        // re-sort, let the left-bottom point to be the first

        for ( i = 1, j= 0; i < newPoints.length; i ++ ) {

            if ( newPoints[i][0]<newPoints[j][0] || newPoints[i][1]<newPoints[j][1] )
                j = i;
        }

        newPoints = newPoints.splice( j ).concat( newPoints );
        return newPoints;
    };

    clipPolygon._clip = function( points, boundary, wMin, wMax ) {

        var newPoints = [];
        var clipedPoints = [];
        var i;
        var p1,p2;
        var p1Inside,p2Inside;

        for ( i = 0; i < points.length; i++ ) {

            p1 = points[i];
            p2 = i < ( points.length - 1 ) ? points[i+1] : points[0];

            p1Inside = clipPolygon._ifInside( p1, boundary, wMin, wMax );
            p2Inside = clipPolygon._ifInside( p2, boundary, wMin, wMax );

            if ( !p1Inside && p2Inside ) {

                clipedPoints.push( clipPolygon._intersect( p1, p2, boundary, wMin, wMax ) );
                clipedPoints.push( p2 );
            }

            if ( p1Inside && p2Inside ) {

                clipedPoints.push( p2 );
            }

            if ( p1Inside && !p2Inside ) {

                clipedPoints.push( p1 );
                clipedPoints.push( clipPolygon._intersect( p1, p2, boundary, wMin, wMax ) );
            }

            if ( !p1Inside && !p2Inside ) continue;
        }

        newPoints = clipPolygon._assemble( clipedPoints );

        if ( boundary < clipPolygon.BOUNDARY_TOP ) {

            return clipPolygon._clip( newPoints, ++boundary, wMin, wMax );
        }

        return newPoints;
    };

    var panPolygon = function( polygon, vector ) {

        var i;
        var newPolygon = [];

        for ( i=0; i < polygon.length; i++ ) {

            newPolygon.push([ polygon[i][0] + vector[0], polygon[i][1] + vector[1] ]);
        }

        return newPolygon;
    };

    var scalePolygon = function( polygon, factor, fixpoint ) {

        fixpoint = fixpoint || [0, 0];

        var i;
        var newPolygon = [];
        for ( i=0; i < polygon.length; i++ ) {

            newPolygon.push([ polygon[i][0]*factor + fixpoint[0]*( 1 - factor ), polygon[i][1]*factor + fixpoint[1]*( 1 - factor )]);
        }

        return newPolygon;
    };

    /* angular modules */

    var ImgRenderFactory = function( $q ) {

        /* image render tool */

        var ImgRender = function() {

            this.img = null;
            this.objCoord=[];
            this.sizeX = 0;
            this.sizeY = 0;
            this.scale = 1;
        };

        ImgRender.prototype = {

            load: function( src ) {

                var _this = this;
                var deferred = $q.defer();

                this.img = new Image();
                this.img.onload = function() {
                    _this.sizeX = _this.img.naturalWidth;
                    _this.sizeY = _this.img.naturalHeight;
                    _this.scale = 1;
                    _this.objCoord = [
                        [ 0, 0 ],
                        [ _this.sizeX, 0 ],
                        [ _this.sizeX, _this.sizeY ],
                        [ 0, _this.sizeY ]
                    ];

                    deferred.resolve( _this );
                };
                this.img.onerror = function() {
                    deferred.reject( src );
                };
                this.img.src = src;

                return deferred.promise;
            },

            _getMaxScale: function() {

                var wW = window.innerWidth;
                var wH = window.innerHeight;

                return Math.max( 4, ~~( (this.sizeX*this.sizeY)/(4*wW*wH) ) );
            },

            _getMinScale: function() {

                var wW = window.innerWidth;
                var wH = window.innerHeight;

                if ( wW*wH > 2*this.sizeX*this.sizeY ) return 1;
                else return wW*wH/(this.sizeX*this.sizeY);
            },

            zoom: function( delta, fixpoint ) {

                var scale = Math.min( Math.max( this._getMinScale(), this.scale + delta ), this._getMaxScale() );
                var fixpoint,factor;

                fixpoint = fixpoint || [0,0];
                factor = scale/this.scale;

                this.objCoord = scalePolygon( this.objCoord, factor, fixpoint );
                this.scale = scale;
                return this;
            },

            pan: function( vector ) {

                this.objCoord = panPolygon( this.objCoord, vector );
                return this;
            },

            render: function( ctx ) {

                if ( !this.img ) return;

                var canvas = ctx.canvas;

                var viewPortSize = [canvas.width, canvas.height];
                var viewPortCoord = [
                    [ 0, 0 ],
                    [ viewPortSize[0], 0 ],
                    [ viewPortSize[0], viewPortSize[1] ],
                    [ 0, viewPortSize[1] ]
                ];

                var transformedCoords = clipPolygon( this.objCoord, viewPortCoord );

                var sx,sy,sw,sh,tx,ty,tw,th;

                try {
                    sx = ( transformedCoords[3][0] - this.objCoord[3][0] )/this.scale;
                    sy = ( this.objCoord[3][1] - transformedCoords[3][1] )/this.scale;
                    sw = ( transformedCoords[2][0] - transformedCoords[3][0] )/this.scale;
                    sh = ( transformedCoords[2][1] - transformedCoords[0][1] )/this.scale;
                    tx = transformedCoords[3][0];
                    ty = viewPortSize[1] - transformedCoords[3][1];
                    tw = transformedCoords[2][0] - transformedCoords[3][0];
                    th = transformedCoords[2][1] - transformedCoords[0][1];

                    ctx.drawImage( this.img, sx, sy, sw, sh, tx, ty, tw, th );
                }

                catch( e ) {}

                return this;
            },

            initAndRender: function( ctx ) {

                if ( !this.img ) return;

                var canvas = ctx.canvas;
                var viewPortSize = [canvas.width, canvas.height];
                var sx,sy,sw,sh,tx,ty,tw,th;

                sx = 0;
                sy = 0;
                sw = this.sizeX;
                sh = this.sizeY;

                tw = sw;
                th = sh;

                if ( tw > viewPortSize[0] ) {
                    th = th*(viewPortSize[0]/tw);
                    tw = viewPortSize[0];
                }

                if ( th > viewPortSize[1] ) {
                    tw = tw*(viewPortSize[1]/th);
                    th = viewPortSize[1];
                }

                tx = ~~( ( viewPortSize[0] - tw )/2 );
                ty = ~~( ( viewPortSize[1] - th )/2 );

                this.scale = tw/sw;
                this.objCoord = [

                    [tx,ty],
                    [tx+tw, ty],
                    [tx+tw, ty+th],
                    [tx,ty+th]
                ];

                ctx.drawImage( this.img, sx, sy, sw, sh, tx, ty, tw, th );

                return this;
            },

            clear: function() {

                this.img = null;
            }
        };

        return ImgRender;
    };

    ImgRenderFactory.$inject = [ '$q' ];

    var GridRenderFactory = function( merge ) {

        /* grid render tool */

        var GridRender = function( range, color ) {

            this._range = merge({
                min: 30,
                max: 110
            }, range );

            this._size     = null;
            this._origin   = null;
            this._color    = color || [0,0,0,0.5];
            this._disabled = false;
        };

        GridRender.prototype = {

            zoom: function( delta ) {

                this._size = Math.max( this._range.min, Math.min( this._range.max, this._size + delta ) );
                this.pan( [0,0] );
                return this;
            },

            pan: function( vector ) {

                this._origin[0] = ( this._origin[0] + vector[0] )%this._size;
                this._origin[1] = ( this._origin[1] + vector[1] )%this._size;
                return this;
            },

            setColor: function( r, g, b, a ) {

                this._color = [ r, g, b, a ];
                return this;
            },

            getColor: function() {
                return 'rgba(' + this._color.join(',') + ')';
            },

            render: function( ctx ) {

                if ( this._disabled ) return;

                var xMax = ctx.canvas.width;
                var yMax = ctx.canvas.height;
                var i,j;

                ctx.strokeStyle = this.getColor();
                ctx.lineWidth = 1;
                for ( i = this._origin[0]; i <= xMax; i+=this._size ) {

                    ctx.beginPath();
                    ctx.moveTo( i, 0 );
                    ctx.lineTo( i, yMax );
                    ctx.stroke();
                }
                for ( j = this._origin[1]; j <= yMax; j+=this._size ) {

                    ctx.beginPath();
                    ctx.moveTo( 0, j );
                    ctx.lineTo( xMax, j );
                    ctx.stroke();
                }

                return this;
            },

            initAndRender: function( ctx ) {

                if ( this._disabled ) return;

                this._size = ~~( ( this._range.min + this._range.max ) / 2 );
                this._origin = [0, 0];

                this.render( ctx );

                return this;
            },

            clear: function() {

                this._disabled = true;
            },

            load: function() {

                this._disabled = false;
            }
        };

        return GridRender;
    };

    GridRenderFactory.$inject = [ '$$merge' ];

    var PainterFactory = function( ImgRender, GridRender ) {

        /* painter main */

        var Painter = function( canvas ) {

            if ( !canvas ) {

                canvas = document.createElement( 'canvas' );
                document.body.appendChild( canvas );
            }

            this.canvas  = canvas;
            this.ctx     = canvas.getContext( '2d' );

            this.deviceRation = window.devicePixelRatio || 1;

            this._img      = new ImgRender();
            this._grid     = new GridRender();

            this._loaded   = false;
            this._switch   = false;
            this._dragData = null;

            this._init();
        };

        Painter.SWITCH_TYPE_IMAGE = 1;
        Painter.SWITCH_TYPE_GRID = 2;

        Painter.prototype = {

            _init: function() {

                var _this = this;
                var eventkey;

                this._resize();

                for ( eventkey in this._handlers ) {

                    (function( k ) {

                        if ( k.indexOf( 'mouse') >= 0 ) {
                            _this.canvas.addEventListener( k, function( e ) {

                                _this._handlers[k].call( _this, e );
                            });
                        }
                        else {
                            window.addEventListener( k, function( e ) {

                                _this._handlers[k].call( _this, e );
                            });
                        }

                    })( eventkey );
                };
            },

            _resize: function() {

                var wW = window.innerWidth;
                var wH = window.innerHeight;
                var wR = this.deviceRation;

                this.canvas.width  = wW*wR;
                this.canvas.height = wH*wR;
                this.canvas.style.width = wW + 'px';
                this.canvas.style.height = wH + 'px';
            },

            _getPointByEvent: function( e ) {

                var wR = this.deviceRation;
                var clientRect = this.canvas.getBoundingClientRect();
                var offsetX    = ( e.pageX - clientRect.left ) * wR;
                var offsetY    = ( e.pageY - clientRect.top ) * wR;
                var coordX     = offsetX;
                var coordY     = this.canvas.height - offsetY;


                return [coordX, coordY];
            },

            _render: function( isInit ) {

                if ( !this._loaded ) return;

                this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

                if ( isInit ) {
                    this._img.initAndRender( this.ctx );
                    this._grid.initAndRender( this.ctx );
                }
                else {
                    this._img.render( this.ctx );
                    this._grid.render( this.ctx );
                }
            },

            _handlers: {

                mousewheel: function( e ) {

                    e.preventDefault();

                    if ( !this._switch ) return;

                    if ( this._switch === Painter.SWITCH_TYPE_IMAGE ) {

                        this._img.zoom( e.deltaY/200, this._getPointByEvent(e) );
                        this._render();
                    }

                    if ( this._switch === Painter.SWITCH_TYPE_GRID ) {

                        this._grid.zoom( e.deltaY/50 );
                        this._render();
                    }
                },

                mousedown: function( e ) {

                    if ( !this._switch ) return;

                    e.preventDefault();

                    this._lastDragData = {
                        x: e.x,
                        y: e.y
                    };
                },

                mousemove: function( e ) {

                    if ( !this._lastDragData ) return;

                    var vector = [ (e.x - this._lastDragData.x)*this.deviceRation, (this._lastDragData.y - e.y)*this.deviceRation ];

                    if ( this._switch === Painter.SWITCH_TYPE_IMAGE ) {

                        this._img.pan( vector );
                        this._render();
                    }

                    if ( this._switch === Painter.SWITCH_TYPE_GRID ) {

                        this._grid.pan( [vector[0], -vector[1]] );
                        this._render();
                    }

                    this._lastDragData = {
                        x: e.x,
                        y: e.y
                    };


                },

                mouseup: function( e ) {

                    this._lastDragData = null;
                },

                resize: function( e ) {

                    var _this = this;

                    clearTimeout( this.__resizeTimer__ );

                    this.__resizeTimer__ = setTimeout( function() {

                        _this._resize();
                        _this._render();
                    }, 50 );
                }

            },

            isloaded: function() {

                return this._loaded;
            },

            import: function( src ) {

                var _this = this;
                var q = this._img.load( src );

                q.then( function() {
                    _this._loaded = true;
                    _this._grid.load();
                    _this._render( true );
                });
                return q;
            },

            export: function() {


            },

            clear: function() {

                this._img.clear();
                this._grid.clear();
                this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

                this._loaded = false;
            },

            reset: function() {

                this._render( true );
            },

            switchOnImage: function() {

                this._switch = Painter.SWITCH_TYPE_IMAGE;
            },
            switchOnGrid: function() {

                this._switch = Painter.SWITCH_TYPE_GRID;
            },
            switchOff: function() {

                this._switch = false;
            },

            setGridColor: function( color ) {

                this._grid.setColor( color.r, color.g, color.b, color.a );
                this._render();
            }
        };

        return Painter;
    };

    PainterFactory.$inject = [ '__ImgRender__', '__GridRender__' ];

    var pntrDirective = function( $rootScope, $compile, Painter ) {

        var painter = null;

        var link = function( $scope, $element ) {

            painter = new Painter( $element.children()[0] );

            // listen $scope broadcast

            $scope.$on( 'imgSrcChanged', function( e, data ) {

                if ( data && data.src ) {

                    !/^data\:image/.test( data.src ) && $rootScope.$broadcast( 'loading', 1 );
                    painter.import( data.src ).then(
                        function() {
                            $rootScope.$broadcast( 'loading', 0 );
                            $rootScope.$broadcast( 'importend', 0 );
                        },
                        function() {
                            painter.isloaded() && painter.clear();
                            $rootScope.$broadcast( 'loading', 0 );
                            $rootScope.$broadcast( 'importend', 1 );
                        }
                    );
                }
            });

            $scope.$on( 'editTypeChanged', function( e, data ) {

                if ( !painter.isloaded() ) return;
                if ( data && data.type == 'image' ) painter.switchOnImage();
                else if ( data && data.type === 'grid' ) painter.switchOnGrid();
                else painter.switchOff();
            });

            $scope.$on( 'colorChanged', function( e, data ) {

                painter.isloaded() && painter.setGridColor( data.color );
            });

            $scope.$on( 'clean', function() {

                painter.isloaded() && painter.clear();
            });

            $scope.$on( 'reset', function() {

                painter.isloaded() && painter.reset();
            });
        };

        return {
            link: link,
            restrict: 'E',
            template: '<canvas></canvas>'
        };
    };

    pntrDirective.$inject = [ '$rootScope', '$compile', '__Painter__' ];

    var viewPainter = angular.module( 'app.view.painter', [] );

    viewPainter.factory( '__ImgRender__', ImgRenderFactory );
    viewPainter.factory( '__GridRender__', GridRenderFactory );
    viewPainter.factory( '__Painter__', PainterFactory );

    viewPainter.directive( 'appUiPainter', pntrDirective );

    exports.viewPainter = viewPainter;

    return exports;
});
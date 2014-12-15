( function( curl ) {
'use strict';

    // init curl
    curl({

        packages: [

            // third-party bower components
            {
                name: 'curl',
                location: 'lib/curl/src/curl'
            },

            {
                name: 'angular',
                main: 'angular',
                location: 'lib/angular/',
                config: {
                    moduleLoader: 'curl/loader/legacy',
                    exports: 'angular'
                }
            },

            // app src inter
            {
                name: 'app',
                location: 'src'
            }
        ]
    });

    curl( ['app'] )
    ;
})( window.curl );
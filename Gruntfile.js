module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    // grunt.loadNpmTasks('grunt-babel');

    grunt.initConfig({

        babel: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    'src/test2.js': 'wip/test2.js'
                }
            }
        }

    });

    grunt.registerTask('default', ['babel']);

};

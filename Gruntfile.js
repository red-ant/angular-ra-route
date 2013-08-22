/* global require */
(function() {
  'use strict';

  module.exports = function(grunt) {
    // Load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
      dist: 'dist',

      clean: {
        dist: ['angular-ra-*.js']
      },

      concat: {
        dist: {
          src:  ['src/angular-ra-route.js'],
          dest: 'angular-ra-route.js'
        }
      },

      uglify: {
        dist: {
          src:  ['src/angular-ra-route.js'],
          dest: 'angular-ra-route.min.js'
        }
      },

      bower: {
        options: {
          copy: false
        },
        install: {}
      },

      jshint: {
        options: {
          jshintrc: '.jshintrc'
        },
        all: [
          'Gruntfile.js',
          'src/{,*/}*.js',
          'test/{,*/}*.js',
        ]
      },

      karma: {
        dev: {
          configFile: 'karma.conf.js',
          singleRun: false
        },

        dist: {
          configFile: 'karma.conf.js'
        }
      }
    });

    grunt.registerTask('test', 'karma:dev');
    grunt.registerTask('build', ['jshint:all', 'bower', 'karma:dist', 'clean', 'concat:dist', 'uglify:dist']);
  };
})();

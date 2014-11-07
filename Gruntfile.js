module.exports = function( grunt ) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      core: {
        src: 'cloudflare/base/frontend/cf_base/cloudflare/js/cloudflare.core.js',
        dest: 'cloudflare/base/frontend/cf_base/cloudflare/js/cloudflare.core.min.js'
      },
      alt: {
        src: 'cloudflare/base/frontend/cf_base/cloudflare/js/cloudflare.js',
        dest: 'cloudflare/base/frontend/cf_base/cloudflare/js/cloudflare-min.js'
      }
    },
    jst: {
      compile: {
        files: {
          "cloudflare/base/frontend/cf_base/cloudflare/js/templates.js": ["cloudflare/base/frontend/cf_base/cloudflare/js/templates/*.html"]
        }
      },
      options: {
        namespace: 'CFT',
        processName: function(filepath) {
          var base = new String(filepath).substring(filepath.lastIndexOf('/') + 1); 
          if(base.lastIndexOf(".") != -1)       
              base = base.substring(0, base.lastIndexOf("."));
          return base;
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jst');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'jst']);
};

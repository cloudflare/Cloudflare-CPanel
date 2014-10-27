module.exports = function( grunt ) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      core: {
        src: 'cloudflare/base/frontend/universal/js2/cloudflare/cloudflare.core.js',
        dest: 'cloudflare/base/frontend/universal/js2-min/cloudflare/cloudflare.core.min.js'
      },
      alt: {
        src: 'cloudflare/base/frontend/universal/js2/cloudflare/cloudflare.js',
        dest: 'cloudflare/base/frontend/universal/js2-min/cloudflare/cloudflare-min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);
};

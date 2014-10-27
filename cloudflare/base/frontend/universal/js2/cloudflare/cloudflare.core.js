/*******************************************************************************
 *
 * CloudFlare Core Framework Functions
 * 
 * @author Christopher Joel
 * 
 * Copyright 2010 CloudFlare, Inc.
 * 
 ******************************************************************************/
 
(function($) {
    
    $.cf = {
        
        noteType: {
            
            alert: 'alert',
            message: 'message',
            warning: 'warning',
            error: 'error'
            
        },
        
        notify: function(message, type, timeout, unique_token) {

            $.cf.notify.tokenMap = $.cf.notify.tokenMap || {};
            
            type = type ? type : $.cf.noteType.message;
            
            timeout = timeout ? (timeout != -1 ? timeout * 1000 : timeout) : 10000;
            
            var note = $('<li class="note ' + type + '"><h1>' + type.toUpperCase() + '</h1><p>' + message + '</p></li>');
            
            if (unique_token) {

                var previous = $.cf.notify.tokenMap[unique_token];
                if (previous) {

                    $(previous).replaceWith(note);
                } else {

                    $('#Notifications').prepend(note);
                }
                $.cf.notify.tokenMap[unique_token] = note;
            } else {

                $('#Notifications').prepend(note);
            }
            
            note.hide().slideDown(
                400,
                function() {
                    
                    if(timeout != -1) {
                        
                        setTimeout(
                            function() {
                                
                                note.slideUp(
                                    400,
                                    function() {
                                        
                                        note.remove();

                                        if (unique_token) {

                                            delete $.cf.notify.tokenMap[unique_token];
                                        }
                                        
                                    }
                                );
                            },
                            timeout
                        );
                    }
                }
            );
        },
        
        clearNotifications: function() {
            
            var currentNotes = $('#Notifications > .note:not(.note.dying)');
            
            currentNotes.addClass('dying');
            
            currentNotes.fadeOut(
                400,
                function() {
                    
                    currentNotes.remove();
                }
            )
        }

    };
        
})(jQuery);

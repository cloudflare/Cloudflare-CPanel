#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define ENVSIZE            (256)

extern char **environ;

static const char *const default_safe_list[] = {
    "SHELL=",
    NULL
};

void make_safeenv(const char * const * safe_list) {
    char **safeenv;
    char **envitem;
    char **oldenv = environ;
    char *empty_env = NULL;
    int envindex = 0;
    int safeenvindex = 0;

    environ = &empty_env;

    if((safeenv = (char **) calloc(ENVSIZE, sizeof(char *))) == NULL) {
        fprintf(stderr, "calloc(%i) failed", ENVSIZE);
        exit(1);
    }

    if(safe_list == NULL) {
        safe_list = default_safe_list;
    }

    for(envitem = oldenv; *envitem != NULL && envindex < ENVSIZE-2; envitem++ ) {
        for(safeenvindex=0; safe_list[safeenvindex]; safeenvindex++) {
            if(!strncmp(*envitem, safe_list[safeenvindex], strlen(safe_list[safeenvindex]))) {
                safeenv[envindex]  = *envitem;
                envindex++;
                break;
            }
        }
    }
    safeenv[envindex] = "PATH=/bin:/sbin:/usr/sbin:/usr/local/bin:/usr/bin";
    safeenv[++envindex] = NULL;

    environ = safeenv;
}

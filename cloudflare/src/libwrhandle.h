#ifndef __LIBWRHANDLE_H
#define __LIBWRHANDLE_H

extern char **environ;

typedef struct __wr_handle {
	FILE *fileh;
	int status;
	pid_t pid;
} WRHANDLE;

WRHANDLE *wropen(const char *cmd);
int wrclose(WRHANDLE *wrhandle);

#endif

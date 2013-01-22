#include <unistd.h>
#include <fcntl.h>
#include <stdlib.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/wait.h>
#include "libwrhandle.h"

WRHANDLE *wropen(const char *cmd) {
	char *cmdargv[] = { (char *) cmd, (char *) 0 };
	int p[2];
	int pid;
	WRHANDLE *wrhandle;

	wrhandle = (WRHANDLE *) malloc(sizeof(WRHANDLE));
	if (wrhandle == NULL) {
		fprintf(stderr,"Failled to allocate memory to run %s\n",cmd);
		exit(1);
	}

	wrhandle->status = 0;

	if ( pipe(p) < 0 ) { return NULL; }

	if (!  ( wrhandle->fileh = fdopen(p[1],"w"))) {
		close(p[0]);
		close(p[1]);
		return NULL;
	}

	if ( (pid = fork()) < 0) {
		close(p[0]);
		close(p[1]);
		return NULL;
	}
	if (! pid) {
		close(p[1]);
		close(0);
		dup2(p[0],0);
		close(p[0]);
		execve(cmd,cmdargv,environ);
		exit(127);
	}
	close(p[0]);
	fcntl(p[1], F_SETFD,FD_CLOEXEC);

	wrhandle->status = 1;
	wrhandle->pid = pid;

	return wrhandle;
}

int wrclose(WRHANDLE *wrhandle) {
	int status;
	fclose(wrhandle->fileh);
	if (waitpid(wrhandle->pid,&status,0)>=0)
	{
		free(wrhandle);
		return status;
	} else {
		free(wrhandle);
		return -1;
	}

}


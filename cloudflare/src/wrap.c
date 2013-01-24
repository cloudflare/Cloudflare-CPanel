/* 
* cpanel - wrap.c                                 Copyright(c) 2010 cPanel, Inc.
*                                                           All rights Reserved.
* copyright@cpanel.net                                         http://cpanel.net
* This code is subject to the cPanel license. Unauthorized copying is prohibited
*
* If you wish to redistribute a version of this for commercial use with cPanel systems, please contact copyright@cpanel.net
*/
#include <signal.h>
#include <unistd.h>
#include <string.h>
#include <ctype.h>
#include <errno.h>
#include <stdlib.h>
#include <stdio.h>
#include <syslog.h>
#include <pwd.h>
#include <grp.h>
#include <sys/types.h>
#include <sys/time.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <fcntl.h>
#include "safeenv.h"
#include "libwrhandle.h"

#define MAX_BUFFER_LENGTH  (1024)
#define MAX_TOKEN_LENGTH   (512)
#define MAX_PATH_LENGTH    (1024)

#define DEFAULT_MAXMEM         (268435456)
#define DEFAULT_DNSONLY_MAXMEM (536870912)

#define CPCONF "/var/cpanel/cpanel.config"
static char *unsafe_passwd_strings[] = { "ADD", "PASS" };

static const char *const safeenv_varlist[] = {
    "REMOTE_USER=",
    "REMOTE_PASSWORD=",
    "CPRESELLERSESSION=",
    "CPRESELLERSESSIONKEY=",
    "Cpanel__DnsRoots__mode=",
    "OWNER=",
    "CPRESELLER=",
    "cp_security_token=",
    NULL
};

/* This data structure holds properties of executables that cpwrap wraps */
struct executable_properties {
    char wrapper_name[MAX_PATH_LENGTH];
    char target_name[MAX_PATH_LENGTH];
    char user[MAX_TOKEN_LENGTH];
    char group[MAX_TOKEN_LENGTH];
    int safe_parent;
    int exec_full;
};

void pass_log_safe(char *logstr, char *munged_logstr);

/* ==================================================================== */
/* OUR SIGNAL HANDLER */
void criterror(int sig)
{
    printf("Modified CP-Wrap Critical Error (signal %d from wrapped program)!  This may indicate a corrupt admin binary in /usr/local/cpanel/bin/\n\n", sig);
    fflush(stdout);
    exit(1);
};

/* ==================================================================== */

void append_str(char *dest, const char *src, int max_dest_size)
{
    if (strlen(dest) + strlen(src) + 1 >= max_dest_size) {
        printf("Overflow error.\n");
        exit(1);
    }
    strncat(dest, src, max_dest_size - strlen(dest) - 1);
}

/* ==================================================================== */
/* Find the appropriate executable in the exec_list by comparing arg string and wrapper_name*/
struct executable_properties *find_exec(struct executable_properties *exec_list, int max_entries, const char *arg)
{
    int i;
    char *arg0 = strrchr(arg, '/');
    for (i = 0; i < max_entries; ++i) {
        if (strstr(arg, exec_list[i].wrapper_name)
            || strstr(arg0, exec_list[i].wrapper_name)) {
            return exec_list + i;
        }
    }
    printf("No Valid program called.\n");
    exit(1);
}

/* ==================================================================== */
int does_file_exist(const char *path)
{
    struct stat file_stats;
    return stat(path, &file_stats) == 0;
}

/* ==================================================================== */
/* WARNING:modifies it's arguments!!!!! */
/* Checks to see if the file exists on disk. If not, it tries appending ".pl" 
   and checks again.
*/
void find_executable_file_on_disk(struct executable_properties *my_exec)
{
    struct stat file_stats;
    if (stat(my_exec->target_name, &file_stats) != 0) {
        append_str(my_exec->target_name, ".pl", sizeof(my_exec->target_name));
        if (stat(my_exec->target_name, &file_stats) != 0) {
            printf("The admin binary called by cpwrap could not be found.  Please checked to see if it exists\n");
            exit(1);
        }
    }
}

/* Reads maxmem setting from cpanel.config */
rlim_t get_maxmem_setting(void)
{
    rlim_t maxmem = DEFAULT_MAXMEM;
    unsigned long long specified_maxmem = 0;
    FILE *cpanel_config_fh = NULL;
    char *buff;
    char *pos;                  /* beginning of maxmem setting */
    char *end_pos;              /* end of maxmem setting       */
    char next_char;
    size_t count = 0;
    struct stat stat_buf;

    if (does_file_exist("/var/cpanel/dnsonly")) {
        maxmem = DEFAULT_DNSONLY_MAXMEM;
    }

    if (stat(CPCONF, &stat_buf) == 0) {
        if (stat_buf.st_size) {
            if ((cpanel_config_fh = fopen(CPCONF, "r")) != NULL) {
                buff = (char *) malloc(stat_buf.st_size + 1);
                if (buff != NULL) {
                    while (count < stat_buf.st_size && !feof(cpanel_config_fh)
                           && !ferror(cpanel_config_fh)) {
                        count += fread((void *) (buff + count), 1, (stat_buf.st_size - count), cpanel_config_fh);
                    }
                    if (count && !ferror(cpanel_config_fh)) {
                        buff[count] = '\0';
                        /* buff should be loaded with cpanel.config now */
                        pos = buff;
                        while ((pos = strstr(pos, "maxmem")) != NULL) {
                            next_char = pos[6];
                            if ((pos == buff || *(pos - 1) == '\n')
                                && (next_char == '=' || next_char == '\0' || isspace(next_char))) {
                                break;
                            }
                            pos += 6;
                        }
                        if (pos != NULL) {
                            pos += 6;
                            while (*pos != '\n' && *pos != '=' && *pos != '\0') {
                                pos++;
                            }
                            if (*pos != '=') {
                                /* When there is a maxmem line with no actual setting it is considered to be unlimited */
                                maxmem = RLIM_INFINITY;
                            } else {
                                pos++;
                                errno = 0;
                                specified_maxmem = strtoull(pos, &end_pos, 10);
                                if (pos == end_pos || specified_maxmem == 0) {
                                    /* No setting specified, this is considered to be unlimited */
                                    maxmem = RLIM_INFINITY;
                                } else if (errno == ERANGE || specified_maxmem > (RLIM_INFINITY >> 20)) {
                                    /* Over the maximum that can fit in rlim_t */
                                    maxmem = RLIM_INFINITY;
                                } else if (specified_maxmem > (maxmem >> 20)) {
                                    /* valid setting that is above default */
                                    maxmem = ((rlim_t) specified_maxmem) << 20;
                                }
                            }
                        }
                    }
                    free(buff);
                }
                fclose(cpanel_config_fh);
            }
        }
    }

    return maxmem;
}

/* ==================================================================== */
void handle_limits()
{
    struct rlimit xl;
    rlim_t maxmem = get_maxmem_setting();

    xl.rlim_max = maxmem;
    xl.rlim_cur = maxmem;
    setrlimit(RLIMIT_RSS, &xl);

#ifdef RLIMIT_AS
    setrlimit(RLIMIT_AS, &xl);
#endif

#ifdef RLIMIT_CORE
    xl.rlim_max = 0;
    xl.rlim_cur = 0;
    setrlimit(RLIMIT_CORE, &xl);
#endif
}

int getpwnam_uid(const char *user)
{
    struct passwd *user_info = getpwnam(user);
    if (!user_info) {
        printf("pwnam: error getting uid for user: %s\n", user);
        exit(1);
    }
    return user_info->pw_uid;
}

/* ==================================================================== */
int get_group(int gid, const char *group)
{
    struct group *group_info;
    if (gid != -1)
        group_info = getgrgid(gid);
    else
        group_info = getgrnam(group);

    if (!group_info) {
        if (gid == -1)
            printf("grnam: error getting gid for group: %s\n", group);
        else
            printf("grnam: error getting gid for gid: %d\n", gid);
        exit(1);
    }
    return group_info->gr_gid;
}

/* ==================================================================== */
void check_if_parent()
{
    char procpath[1024];
    char readlinkbuf[1024];
    int cpanelisparent = 0;
    pid_t ppid;

    if (does_file_exist("/var/cpanel/skipparentcheck"))
        return;

    ppid = getppid();

    snprintf(procpath, (sizeof(procpath) - 1), "/proc/%d", ppid);
    if (does_file_exist(procpath)) {
        snprintf(procpath, (sizeof(procpath) - 1), "/proc/%d/exe", ppid);
        if (does_file_exist(procpath)
            && readlink(procpath, readlinkbuf, sizeof(readlinkbuf) - 1) > 0) {
            if (readlinkbuf == strstr(readlinkbuf, "/usr/local/cpanel/cpanel")) {
                cpanelisparent = 1;
            } else {
                syslog(LOG_INFO, "cPWrapper run with a parent: %s\n", readlinkbuf);
            }
        }

        snprintf(procpath, (sizeof(procpath) - 1), "/proc/%d/file", ppid);
        if (!cpanelisparent && does_file_exist(procpath)
            && readlink(procpath, readlinkbuf, sizeof(readlinkbuf) - 1) > 0) {
            if (readlinkbuf == strstr(readlinkbuf, "/usr/local/cpanel/cpanel")) {
                cpanelisparent = 1;
            } else {
                syslog(LOG_INFO, "cPWrapper run with a parent: %s\n", readlinkbuf);
            }
        }

        if (!cpanelisparent) {
            printf("This wrapper may only be run from the cpanel binary.  This setting can be adjusted in Tweak Settings.\n");
            syslog(LOG_INFO, "cPWrapper run with a parent other then cpanel\n");
            fflush(stdout);
            exit(1);
        }
    }
}

/* ==================================================================== */
void append_tokens(char *args, char **argv, int max_length)
{
    int ca = 1;
    while (argv[ca] != NULL) {
        if (strlen(argv[ca]) < MAX_TOKEN_LENGTH) {
            append_str(args, " ", max_length);
            append_str(args, argv[ca], max_length);
        }
        ca++;
    }
}

/* ==================================================================== */
void append_stdin(char *args, int max_length)
{
    char buf[MAX_TOKEN_LENGTH];
    FILE *stdinf;
    append_str(args, " ", max_length);
    stdinf = fdopen(0, "r");
    fgets(buf, sizeof(buf), stdinf);
    append_str(args, buf, max_length);
}

/* ==================================================================== */
void handle_uid_gid(const char *user, const char *group)
{
    int gid = -1;
    int uid;
    //setgroups (0, NULL);

    gid = get_group(gid, group);
    if ((setregid(gid, gid)) != 0) {
        int errsv = errno;
        printf("There was an error setting gids: %d (%s)\n", errsv, strerror(errsv));
        syslog(LOG_INFO, "Modified Cp-Wrapper error changing gids: error: %d (%s)\n", errsv, strerror(errsv));
        exit(1);
    }

    uid = getpwnam_uid(user);
    if ((initgroups(user, gid)) == -1) {
        int errsv = errno;
        printf("There was an error initing groups: %d (%s)\n", errsv, strerror(errsv));
        syslog(LOG_INFO, "Modified Cp-Wrapper error initing groups: error: %d (%s)\n", errsv, strerror(errsv));
        exit(1);
    }

    if ((setreuid(uid, uid)) != 0) {
        int errsv = errno;
        printf("There was an error setting uids: %d (%s)\n", errsv, strerror(errsv));
        syslog(LOG_INFO, "Modified Cp-Wrapper error changing uids: error: %d (%s)\n", errsv, strerror(errsv));
        exit(1);
    }
}

/* ==================================================================== */
void execute_process(struct executable_properties *my_exec, const char *uid)
{
    execlp(my_exec->target_name, my_exec->target_name, uid, NULL);
    printf("There was an error executing the admin program.  Please have the admin check permissions on: %s\n", my_exec->target_name);
    syslog(LOG_INFO, "Modified Cp-Wrapper error executing admin program\n");
    exit(1);
}

/* ==================================================================== */
int execute_pipe_process(struct executable_properties *my_exec, const char *args)
{
    int ret;
    WRHANDLE *admin;
    if ((admin = wropen(my_exec->target_name)) == NULL) {
        printf("There was an error opening the admin program.  Please have the admin check permissions on: %s\n", my_exec->target_name);
        syslog(LOG_INFO, "Modified Cp-Wrapper error opening admin program\n");
    }
    fprintf(admin->fileh, "%s", args);
    fflush(admin->fileh);
    ret = wrclose(admin);
    return ret;
}

/* ==================================================================== */

int main(int argc, char **argv)
{
	// Change the exec list array for whatever program you are working with
	// see README for more details
    /* wrapper_name     target_name                   user group safeparent exec_full */
    struct executable_properties exec_list [1] = {
        { "cfwrap",      "/usr/local/cpanel/bin/cfadmin",      "root", "wheel", 1, 0 }
    };

    struct executable_properties *my_exec = NULL;

    char args[MAX_BUFFER_LENGTH];
    char uid_str[MAX_TOKEN_LENGTH];
    char munged_logstr[MAX_BUFFER_LENGTH];

    int ret;

    signal(SIGPIPE, criterror);

    make_safeenv(safeenv_varlist);

    chdir("/");
    chdir("/usr/local/cpanel");

    my_exec = find_exec(exec_list, sizeof(exec_list) / sizeof(struct executable_properties), argv[0]);

    find_executable_file_on_disk(my_exec);

    /* Reset our strings */
    args[0] = '\0';
    uid_str[0] = '\0';

    snprintf(uid_str, sizeof(uid_str), "%d", getuid());
    append_str(args, uid_str, sizeof(args));

    if (argv[1] != NULL)
        append_tokens(args, argv, sizeof(args));
    else if (!my_exec->exec_full)
        append_stdin(args, sizeof(args));

    openlog("Cp-Wrap", LOG_CONS | LOG_NDELAY | LOG_PID, LOG_AUTHPRIV);
    pass_log_safe(args, munged_logstr);
    syslog(LOG_INFO, "Pushing \"%s\" to \'%s\' for UID: %d\n", munged_logstr, my_exec->target_name, getuid());

    handle_limits();
    handle_uid_gid(my_exec->user, my_exec->group);

    if (my_exec->safe_parent)
        check_if_parent();

    if (my_exec->exec_full)
        execute_process(my_exec, uid_str);
    else
        ret = execute_pipe_process(my_exec, args);

    setreuid(99, 99);
    if (ret == SIGSEGV) {
        syslog(LOG_INFO, "Modified Cp-Wrapper terminated with SEGV error from wrapped program\n");
        closelog();
        criterror(ret);
    }
    syslog(LOG_INFO, "Modified Cp-Wrapper terminated without error\n");
    closelog();

    if (ret > 0)
        exit(1);
    exit(0);
}

void pass_log_safe(char *logstr, char *munged_logstr)
{
    const char *startpt;
    int n, i, argcnt, position;

    strncpy(munged_logstr, logstr, MAX_BUFFER_LENGTH);

    for (n = 0; n < sizeof(unsafe_passwd_strings) / sizeof(unsafe_passwd_strings[0]); n++) {
        startpt = strstr(munged_logstr, unsafe_passwd_strings[n]);
        if (startpt == NULL) {
            continue;
        }
        position = startpt - munged_logstr;
        argcnt = 0;
        for (i = position; i < strlen(munged_logstr); i++) {
            if (munged_logstr[i] == ' ') {
                argcnt++;
            } else if (argcnt == 2) {
                munged_logstr[i] = 'X';
            } else if (argcnt > 2) {
                break;
            }
        }
    }
    return;
}

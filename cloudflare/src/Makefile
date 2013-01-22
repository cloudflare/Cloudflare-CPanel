#modify this line to the name of the admin binary you are adding
PROG_NAME=cf

CC=gcc
CFLAGS=`/usr/local/cpanel/optflags` -O3 -fomit-frame-pointer -fno-exceptions -pipe -ffast-math -fexpensive-optimizations -falign-loops=2 -falign-jumps=2 -falign-functions=2 -s -Wall

all: adminbin
		
adminbin: wrap.o safeenv.o libwrhandle.o
	$(CC) $(CFLAGS) $^ -o $(PROG_NAME)wrap

install:
	install -m 4755 -s $(PROG_NAME)wrap /usr/local/cpanel/bin/$(PROG_NAME)wrap
	
clean:
	rm -f $(PROG_NAME)wrap *.*~ *.o 

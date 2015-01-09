rm -f cloudflare_simple.tar.bz2
rm -f cloudflare_simple.x3.tar.bz2
rm -f cloudflare.tar.bz2
rm -f cloudflare.x3.tar.bz2

tar -jcvf cloudflare_simple.tar.bz2 cloudflare_simple/*
tar -jcvf cloudflare_simple.x3.tar.bz2 cloudflare_simple_x3/*
tar -jcvf cloudflare.tar.bz2 cloudflare/*
tar -jcvf cloudflare.x3.tar.bz2 cloudflare_x3/*

#!/bin/sh

version=`python -V 2>&1`
version=`echo $version | cut -c8`

start_browser() {
	sleep 1
	firefox "http://localhost:8000/tests/test_all.html"
}
start_browser &

if [ $version == '3' ]
    then
        python -m http.server
    else
        python2 -m SimpleHTTPServer
fi


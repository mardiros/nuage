#!/bin/sh

version=`python2 -V 2>&1`
version=`echo $version | cut -c8`

if [ ! -e "bottle.py" ]
    then
        # wget "https://raw.github.com/defnull/bottle/release-0.10/bottle.py"
        wget "http://bottlepy.org/bottle.py"
        if [ $version == '3' ]
            then
                2to3 -w bottle.py
        fi
        mkdir script
        cp ../../dist/nuage.js script/nuage.js

fi

python2 webapp.py
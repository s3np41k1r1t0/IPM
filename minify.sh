#!/bin/sh

if [ ! -d server ]
then
    mkdir server
    mkdir server/static
    mkdir server/data
fi

cp src/static/* server/static
cp src/data/* server/data

cp src/style.css server/style.css
cp src/index.html server/index.html
cp src/project.js server/project.js

#!/bin/sh

mkdir server 

cp src/static/* server/static
cp src/data/* server/data

cp src/style.css server/style.css
cp src/index.html server/index.html
google-closure-compiler --js src/project.js --js_output_file server/project.js

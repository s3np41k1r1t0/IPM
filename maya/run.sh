#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage ./start.sh PORT_NUMBER"
  exit 1
fi


docker build . -t maya_ipm
docker run --rm -p $1:5000 -it maya_ipm

#!/bin/bash
if ! [ -d "./database" ] ; then
    echo "must be runned as ./install.sh"
    exit 1
fi
cp database/data/ad_database.sqlite ../site/public/tools/dtc_query/

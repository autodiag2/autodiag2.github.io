#!/bin/bash
if ! [ -d "../site/public/tools/dtc_query/" ] ; then
    echo "must be runned as ./update.sh"
    exit 1
fi
rm -f ../site/public/tools/dtc_query/ad_database.sqlite
wget -P ../site/public/tools/dtc_query/ https://github.com/autodiag2/database/releases/latest/download/ad_database.sqlite

#!/bin/bash
if ! [ -d "./database" ] ; then
    echo "must be runned as ./install.sh"
    exit 1
fi
wget -P ../site/public/tools/dtc_query/ https://github.com/autodiag2/database/releases/latest/download/ad_database.sqlite
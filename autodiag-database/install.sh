#!/bin/bash
if ! [ -d "./database" ] ; then
    echo "must be runned as ./install.sh"
    exit 1
fi
cd database
./manager/manager/compile_dtcs_json.py --out ../../site/public/tools/dtc_query/dtc.json
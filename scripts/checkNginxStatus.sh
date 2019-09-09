#!/bin/bash
NGING_STAMP_FILE="/tmp/configstamp"
[ -f $NGING_STAMP_FILE ] && touch $NGING_STAMP_FILE
if [[ $(find /etc/nginx/conf.d/SITES_ENABLED/ -type f -exec md5sum {} \; | md5sum | cut -c-32 ) != $(cat ${NGING_STAMP_FILE})  ]]; then
        sudo /etc/init.d/nginx reload;
        echo $(find /etc/nginx/conf.d/SITES_ENABLED/ -type f -exec md5sum {} \; | md5sum | cut -c-32 ) > $NGING_STAMP_FILE;
fi

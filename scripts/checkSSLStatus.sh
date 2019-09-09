#!/bin/bash
SSL_STAMP_FILE="/tmp/sslstamp"
[ -f $SSL_STAMP_FILE ] && touch $SSL_STAMP_FILE
if [[ $(find /var/lib/jelastic/SSL/ -type f -exec md5sum {} \; | md5sum | cut -c-32 ) != $(cat ${SSL_STAMP_FILE})  ]]; then
        jem ssl install;
        sudo jem service restart;
        echo $(find /var/lib/jelastic/SSL/ -type f -exec md5sum {} \; | md5sum | cut -c-32 ) > $SSL_STAMP_FILE;
fi

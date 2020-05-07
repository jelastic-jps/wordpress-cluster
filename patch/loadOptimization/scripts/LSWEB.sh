#!/bin/bash

DEFAULT_LSWS_CONFIG="/var/www/conf/httpd_config.xml"
DEFAULT_VIRTUALHOST_CONFIG="/var/www/webroot/vhconf.xml"
PHPMYADMIN_VIRTUALHOST_CONFIG="/usr/share/phpMyAdmin/vhost.conf"
ED_CMD="ed --inplace"

cp -f "${DEFAULT_LSWS_CONFIG}" ${DEFAULT_LSWS_CONFIG}.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1
cp -f "${DEFAULT_VIRTUALHOST_CONFIG}" ${DEFAULT_VIRTUALHOST_CONFIG}.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1
[ -f "${PHPMYADMIN_VIRTUALHOST_CONFIG}" ] && { cp -f "${PHPMYADMIN_VIRTUALHOST_CONFIG}" ${PHPMYADMIN_VIRTUALHOST_CONFIG}.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1; }

if [ -e ${DEFAULT_LSWS_CONFIG} ]; then 
  /usr/bin/xmlstarlet $ED_CMD -d "httpServerConfig/security/wpProtectAction" ${DEFAULT_LSWS_CONFIG} 2>&1;
  /usr/bin/xmlstarlet $ED_CMD -s "httpServerConfig/security" -t elem -n "wpProtectAction" -v "0" ${DEFAULT_LSWS_CONFIG} 2>&1;
  /usr/bin/xmlstarlet $ED_CMD -u "httpServerConfig/tuning/enableGzipCompress" -v "0" ${DEFAULT_LSWS_CONFIG} 2>&1;
fi
for i in ${DEFAULT_VIRTUALHOST_CONFIG} ${PHPMYADMIN_VIRTUALHOST_CONFIG}
do
    if [ -e ${i} ]; then 
        /usr/bin/xmlstarlet $ED_CMD -d "virtualHostConfig/security/wpProtectAction" ${i} 2>&1;
        /usr/bin/xmlstarlet $ED_CMD -s "virtualHostConfig/security" -t elem -n "wpProtectAction" -v "0" ${i} 2>&1;
    fi
done

sudo service lsws reload

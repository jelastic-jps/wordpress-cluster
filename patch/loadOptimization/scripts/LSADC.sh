#!/bin/bash

LSLB_CONF="/var/www/conf/lslbd_config.xml"
VH_CONF="/var/www/conf/jelastic.xml"
ED_CMD="ed --inplace"

WP_PROTECT_ACTION=3
WP_PROTECT_LIMIT=100

cp -f ${LSLB_CONF} ${LSLB_CONF}.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1

#Wordpress Brute Force Attacks Protect
/usr/bin/xmlstarlet ${ED_CMD} -d "loadBalancerConfig/security/wpProtectAction" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -d "loadBalancerConfig/security/wpProtectLimit" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -d "virtualHostConfig/security/wpProtectAction" "${VH_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -d "virtualHostConfig/security/wpProtectLimit" "${VH_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -s "loadBalancerConfig/security" -t elem -n "wpProtectLimit" -v "${WP_PROTECT_LIMIT}" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -s "loadBalancerConfig/security" -t elem -n "wpProtectAction" -v "${WP_PROTECT_ACTION}" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -s "virtualHostConfig/security" -t elem -n "wpProtectLimit" -v "${WP_PROTECT_LIMIT}" "${VH_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -s "virtualHostConfig/security" -t elem -n "wpProtectAction" -v "${WP_PROTECT_ACTION}" "${VH_CONF}" 2>/dev/null;

#Load Balancer Optimization
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/workerGroupList/workerGroup[name = "*"]/maxConns" -v "150" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/workerGroupList/workerGroup[name = "*"]/retryTimeout" -v "5" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/workerGroupList/workerGroup/pingInterval" -v "1" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/strategy" -v "3" "${LSLB_CONF}" 2>/dev/null;

sudo service lslb reload

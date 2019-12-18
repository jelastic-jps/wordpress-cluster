#!/bin/bash

LSLB_CONF="/var/www/conf/lslbd_config.xml"
ED_CMD="ed --inplace"

cp -f ${LSLB_CONF} ${LSLB_CONF}.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1

/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/workerGroupList/workerGroup[name = "*"]/maxConns" -v "2000" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/workerGroupList/workerGroup[name = "*"]/retryTimeout" -v "5" "${LSLB_CONF}" 2>/dev/null;
/usr/bin/xmlstarlet ${ED_CMD} -u "loadBalancerConfig/loadBalancerList/loadBalancer[name = "*"]/strategy" -v "2" "${LSLB_CONF}" 2>/dev/null;

sudo service lslb reload

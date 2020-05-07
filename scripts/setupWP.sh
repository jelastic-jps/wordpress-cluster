#!/bin/bash -e

purge=false;
pgcache=false;
objectcache=false;
edgeportCDN=false;
wpmu=false;
DOMAIN=false;

SERVER_WEBROOT=/var/www/webroot/ROOT

ARGUMENT_LIST=(
    "purge"
    "pgcache"
    "objectcache"
    "edgeportCDN"
    "wpmu"
    "REDIS_HOST"
    "REDIS_PASS"
    "CDN_URL"
    "CDN_ORI"
    "MODE"
    "DOMAIN"

)

WP=`which wp`

# read arguments
opts=$(getopt \
    --longoptions "$(printf "%s:," "${ARGUMENT_LIST[@]}")" \
    --name "$(basename "$0")" \
    --options "" \
    -- "$@"
)
eval set --$opts

while [[ $# -gt 0 ]]; do
    case "$1" in
        --purge)
            purge=$2
            shift 2
            ;;

        --pgcache)
            pgcache=$2
            shift 2
            ;;

        --objectcache)
            objectcache=$2
            shift 2
            ;;

        --edgeportCDN)
            edgeportCDN=$2
            shift 2
            ;;

        --REDIS_HOST)
            REDIS_HOST=$2
            shift 2
            ;;

        --REDIS_PASS)
            REDIS_PASS=$2
            shift 2
            ;;

        --CDN_URL)
            CDN_URL=$2
            shift 2
            ;;

        --CDN_ORI)
            CDN_ORI=$2
            shift 2
            ;;

        --wpmu)
            wpmu=$2
            shift 2
            ;;

        --MODE)
            MODE=$2
            shift 2
            ;;

        --DOMAIN)
            DOMAIN=$2
            shift 2
            ;;

        *)
            break
            ;;
    esac
done

W3TC_OPTION_SET="${WP} w3-total-cache option set"
LSCWP_OPTION_SET="${WP} litespeed-option set"
lOG="/var/log/run.log"

COMPUTE_TYPE=$(grep "COMPUTE_TYPE=" /etc/jelastic/metainf.conf | cut -d"=" -f2)

cd ${SERVER_WEBROOT};

if [[ ${COMPUTE_TYPE} == *"llsmp"* || ${COMPUTE_TYPE} == *"litespeed"* ]] ; then
	${WP} plugin install litespeed-cache --activate --path=${SERVER_WEBROOT}
	CACHE_FLUSH="${WP} litespeed-purge all --path=${SERVER_WEBROOT}; rm -rf /var/www/webroot/.cache/vhosts/Jelastic/* "
        WPCACHE='lscwp';
elif [[ ${COMPUTE_TYPE} == *"lemp"* || ${COMPUTE_TYPE} == *"nginx"* ]] ; then
	${WP} plugin install w3-total-cache --activate --path=${SERVER_WEBROOT}
	CACHE_FLUSH="${WP} w3-total-cache flush all --path=${SERVER_WEBROOT}; /var/www/webroot/.cache/* "
        WPCACHE="w3tc";
else
        echo 'Compute type is not defined';
	exit;
fi

function checkCdnStatus () {
if [ $WPCACHE == 'w3tc' ] ; then
	CDN_ENABLE_CMD="${WP} w3-total-cache option set cdn.enabled true --type=boolean"
elif [ $WPCACHE == 'lscwp' ] ; then
	CDN_ENABLE_CMD="${WP} litespeed-option set cdn true"
fi
cat > ~/bin/checkCdnStatus.sh <<EOF
#!/bin/bash
while read -ru 4 CONTENT; do
  status=\$(curl \$1\$CONTENT -k -s -f -o /dev/null && echo "SUCCESS" || echo "ERROR")
    if [ \$status = "SUCCESS" ]
    then
      continue
    else
      exit
    fi
done 4< ~/bin/checkCdnContent.txt
cd ${SERVER_WEBROOT}
${CDN_ENABLE_CMD} --path=${SERVER_WEBROOT} &>> /var/log/run.log
${CACHE_FLUSH}  &>> /var/log/run.log
${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
crontab -l | sed "/checkCdnStatus/d" | crontab -
EOF
chmod +x ~/bin/checkCdnStatus.sh
PROTOCOL=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d':' -f1)
crontab -l | { cat; echo "* * * * * /bin/bash ~/bin/checkCdnStatus.sh ${PROTOCOL}://${CDN_URL}/"; } | crontab
}

if [ $purge == 'true' ] ; then
	${CACHE_FLUSH} &>> /var/log/run.log
	${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
	[ -d /tmp/lscache/vhosts/ ] && /usr/bin/rm -rf /tmp/lscache/vhosts/Jelastic/* &>> /var/log/run.log
fi

if [ $pgcache == 'true' ] ; then
  case $WPCACHE in
    w3tc)
	  $W3TC_OPTION_SET pgcache.enabled true --type=boolean --path=${SERVER_WEBROOT} &>> $lOG
          $W3TC_OPTION_SET pgcache.file.nfs true --type=boolean --path=${SERVER_WEBROOT} &>> $lOG
          ;;
    lscwp)
          $LSCWP_OPTION_SET cache_browser true --path=${SERVER_WEBROOT} &>> $lOG
          $LSCWP_OPTION_SET css_http2 true --path=${SERVER_WEBROOT} &>> $lOG
          $LSCWP_OPTION_SET js_http2 true --path=${SERVER_WEBROOT} &>> $lOG
          $LSCWP_OPTION_SET optm_qs_rm true --path=${SERVER_WEBROOT} &>> $lOG
          $LSCWP_OPTION_SET optm_emoji_rm true --path=${SERVER_WEBROOT} &>> $lOG
          $LSCWP_OPTION_SET esi_enabled true --path=${SERVER_WEBROOT} &>> $lOG
	  $LSCWP_OPTION_SET cache_priv false --path=${SERVER_WEBROOT} &>> $lOG
          ;;
  esac
fi

if [ $objectcache == 'true' ] ; then
  case $WPCACHE in
    w3tc)
          $W3TC_OPTION_SET objectcache.enabled true --type=boolean --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.engine redis --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.redis.servers ${REDIS_HOST}:6379 --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.redis.password ${REDIS_PASS} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
    lscwp)
          $LSCWP_OPTION_SET object true --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-kind 1 --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-host ${REDIS_HOST} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-port 6379 --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
  esac
fi

if [ $edgeportCDN == 'true' ] ; then
  if ! $(${WP} core is-installed --network --path=${SERVER_WEBROOT}); then 
    case $WPCACHE in
      w3tc)
          checkCdnStatus;
          $W3TC_OPTION_SET cdn.enabled false --type=boolean --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET cdn.engine mirror --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET cdn.mirror.domain ${CDN_URL} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
      lscwp)
        checkCdnStatus;
        CDN_ORI=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d'/' -f3)
        PROTOCOL=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d':' -f1)
        $LSCWP_OPTION_SET cdn false --path=${SERVER_WEBROOT} &>> /var/log/run.log
        $LSCWP_OPTION_SET cdn-mapping[url][0] ${PROTOCOL}://${CDN_URL}/ --path=${SERVER_WEBROOT} &>> /var/log/run.log
        $LSCWP_OPTION_SET cdn-ori "//${CDN_ORI}/" --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
    esac
  fi
fi

if [ $wpmu == 'true' ] ; then
  case $WPCACHE in
    w3tc)
          ${WP} plugin deactivate w3-total-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
	  [[ ${MODE} == 'subdir' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} &>> /var/log/run.log
	  [[ ${MODE} == 'subdom' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} --subdomains &>> /var/log/run.log
	  ${WP} plugin activate w3-total-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
    lscwp)
          ${WP} plugin deactivate litespeed-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
          [[ ${MODE} == 'subdir' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} &>> /var/log/run.log
          [[ ${MODE} == 'subdom' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} --subdomains &>> /var/log/run.log
          ${WP} plugin activate litespeed-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
  esac
fi

if [ $DOMAIN != 'false' ] ; then
  if ! $(${WP} core is-installed --network --path=${SERVER_WEBROOT}); then 
	OLD_DOMAIN=$(${WP} option get siteurl --path=${SERVER_WEBROOT})
	OLD_SHORT_DOMAIN=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d'/' -f3)
	NEW_SHORT_DOMAIN=$(echo $DOMAIN | cut -d'/' -f3)

	${WP} search-replace "${OLD_DOMAIN}" "${DOMAIN}" --skip-columns=guid --all-tables --path=${SERVER_WEBROOT} &>> /var/log/run.log
	${WP} search-replace "${OLD_SHORT_DOMAIN}" "${NEW_SHORT_DOMAIN}" --skip-columns=guid --all-tables --path=${SERVER_WEBROOT} &>> /var/log/run.log
	${CACHE_FLUSH}  &>> /var/log/run.log
	${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
  fi
fi

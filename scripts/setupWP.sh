#!/bin/bash -e

purge=false;
pgcache=false;
objectcache=false;
edgeportCDN=false;
multisite=false;
domain=false;
url=false;
woocommerce=false;

SERVER_WEBROOT=/var/www/webroot/ROOT

ARGUMENT_LIST=(
    "purge"
    "pgcache"
    "objectcache"
    "edgeportCDN"
    "multisite"
    "REDIS_HOST"
    "REDIS_PASS"
    "REDIS_PORT"
    "CDN_URL"
    "CDN_ORI"
    "mode"
    "url"
    "domain"
    "ENV_NAME"
    "woocommerce"

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

        --REDIS_PORT)
            REDIS_PORT=$2
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

        --multisite)
            multisite=$2
            shift 2
            ;;

        --mode)
            mode=$2
            shift 2
            ;;

        --url)
            url=$2
            shift 2
            ;;

        --domain)
            domain=$2
            shift 2
            ;;

        --ENV_NAME)
            ENV_NAME=$2
            shift 2
            ;;

	--woocommerce)
	    woocommerce=$2
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

function generateCdnContent () {
    echo "wp-content/themes/twentytwentytwo/style.css" > ~/checkCdnContent.txt;
    echo "wp-includes/css/dist/block-library/style.min.css" >> ~/checkCdnContent.txt;
    echo "wp-includes/css/dist/block-library/theme.min.css" >> ~/checkCdnContent.txt;
    echo "wp-includes/js/wp-embed.min.js" >> ~/checkCdnContent.txt;
}

function checkCdnStatus () {
if [ $WPCACHE == 'w3tc' ] ; then
    CDN_ENABLE_CMD="${WP} w3-total-cache option set cdn.enabled true --type=boolean"
elif [ $WPCACHE == 'lscwp' ] ; then
    CDN_ENABLE_CMD="${WP} litespeed-option set cdn true"
fi
cat > ~/checkCdnStatus.sh <<EOF
#!/bin/bash
while read -ru 4 CONTENT; do
  status=\$(curl \$1\$CONTENT -k -s -f -o /dev/null && echo "SUCCESS" || echo "ERROR")
    if [ \$status = "SUCCESS" ]
    then
      continue
    else
      exit
    fi
done 4< ~/checkCdnContent.txt
cd ${SERVER_WEBROOT}
${CDN_ENABLE_CMD} --path=${SERVER_WEBROOT} &>> /var/log/run.log
${CACHE_FLUSH}  &>> /var/log/run.log
${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
crontab -l | sed "/checkCdnStatus/d" | crontab -
EOF
chmod +x ~/checkCdnStatus.sh
PROTOCOL=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d':' -f1)
crontab -l | { cat; echo "* * * * * /bin/bash ~/checkCdnStatus.sh ${PROTOCOL}://${CDN_URL}/"; } | crontab
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
          ;;
  esac
fi

if [ $objectcache == 'true' ] ; then
  case $WPCACHE in
    w3tc)
          $W3TC_OPTION_SET objectcache.enabled true --type=boolean --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.engine redis --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.redis.servers ${REDIS_HOST}:${REDIS_PORT} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET objectcache.redis.password ${REDIS_PASS} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
    lscwp)
          $LSCWP_OPTION_SET object true --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-kind 1 --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-host ${REDIS_HOST} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $LSCWP_OPTION_SET object-port ${REDIS_PORT} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
  esac
fi

if [ $edgeportCDN == 'true' ] ; then
  if ! $(${WP} core is-installed --network --path=${SERVER_WEBROOT}); then
    case $WPCACHE in
      w3tc)
          generateCdnContent;
          checkCdnStatus;
          $W3TC_OPTION_SET cdn.enabled false --type=boolean --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET cdn.engine mirror --path=${SERVER_WEBROOT} &>> /var/log/run.log
          $W3TC_OPTION_SET cdn.mirror.domain ${CDN_URL} --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
      lscwp)
          generateCdnContent;
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

if [ $multisite == 'true' ] ; then
  cd ~/bin/ && ${WP} option update permalink_structure '' --path=/var/www/webroot/ROOT/ &>> /var/log/run.log;
  cd ~/bin/ && ${WP} rewrite structure '' --hard --path=/var/www/webroot/ROOT/ &>> /var/log/run.log;
  case $WPCACHE in
    w3tc)
          ${WP} plugin deactivate w3-total-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
          [[ ${mode} == 'subdir' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} &>> /var/log/run.log
          [[ ${mode} == 'subdom' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} --subdomains &>> /var/log/run.log
          ${WP} plugin activate w3-total-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log
          ;;
    lscwp)
          ${WP} plugin deactivate litespeed-cache --path=${SERVER_WEBROOT} &>> /var/log/run.log;
          [[ ${mode} == 'subdir' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} &>> /var/log/run.log;
          [[ ${mode} == 'subdom' ]] && ${WP} core multisite-convert --path=${SERVER_WEBROOT} --subdomains &>> /var/log/run.log;
          ${WP} plugin activate litespeed-cache --network --path=${SERVER_WEBROOT} &>> /var/log/run.log;
	  ${WP} cache flush --path=${SERVER_WEBROOT};
	  echo "Configuring litespeed.conf.cache" >> /var/log/run.log;
          ${WP} db query "UPDATE wp_sitemeta set meta_value = 1 where meta_key = 'litespeed.conf.cache'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
	  ${WP} db query "select meta_value from wp_sitemeta where meta_key = 'litespeed.conf.cache'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
	  
	  echo "Configuring litespeed.conf.object" >> /var/log/run.log;
          ${WP} db query "UPDATE wp_sitemeta set meta_value = 1 where meta_key = 'litespeed.conf.object'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
	  echo "Configuring litespeed.conf.object-kind" >> /var/log/run.log;
          ${WP} db query "UPDATE wp_sitemeta set meta_value = 1 where meta_key = 'litespeed.conf.object-kind'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
	  
	  echo "Configuring litespeed.conf.object-host" >> /var/log/run.log;
          ${WP} db query "UPDATE wp_sitemeta set meta_value = '/var/run/redis/redis.sock' where meta_key = 'litespeed.conf.object-host'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
          
	  echo "Configuring litespeed.conf.object-port" >> /var/log/run.log;
	  ${WP} db query "UPDATE wp_sitemeta set meta_value = 0 where meta_key = 'litespeed.conf.object-port'" --path=${SERVER_WEBROOT} &>> /var/log/run.log;
          ;;
  esac
fi

if [ $url != 'false' ] ; then
  if ! $(${WP} core is-installed --network --path=${SERVER_WEBROOT}); then
    old_url=$(${WP} option get siteurl --path=${SERVER_WEBROOT})
    old_domain=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d'/' -f3)
    new_domain=$(echo $url | cut -d'/' -f3)
    ${WP} search-replace "${old_url}" "${url}" --skip-columns=guid --all-tables --path=${SERVER_WEBROOT} &>> /var/log/run.log
    ${WP} search-replace "${old_domain}" "${new_domain}" --skip-columns=guid --all-tables --path=${SERVER_WEBROOT} &>> /var/log/run.log
    ${CACHE_FLUSH}  &>> /var/log/run.log
    ${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
  fi
fi

if [ $domain != 'false' ] ; then
  if ! $(${WP} core is-installed --network --path=${SERVER_WEBROOT}); then
    old_domain=$(${WP} option get siteurl --path=${SERVER_WEBROOT} | cut -d'/' -f3)
    ${WP} search-replace "${old_domain}" "${domain}" --skip-columns=guid --all-tables --path=${SERVER_WEBROOT} &>> /var/log/run.log
    ${CACHE_FLUSH}  &>> /var/log/run.log
    ${WP} cache flush --path=${SERVER_WEBROOT} &>> /var/log/run.log
  fi
fi

if [ $woocommerce == 'true' ] ; then
  ${WP} plugin install woocommerce --activate --path=${SERVER_WEBROOT} &>> /var/log/run.log
fi

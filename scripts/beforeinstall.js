var wpbfp = '${settings.wp_protect}' == 'true' ? "THROTTLE" : "OFF";
var db_cluster = '${settings.galera}' == 'true' ? "galera" : "master";
var db_count = '${settings.galera}' == 'true' ? 3 : 2;

var resp = {
  result: 0,
  ssl: !!jelastic.billing.account.GetQuotas('environment.jelasticssl.enabled').array[0].value,
  nodes: []
}

if (${settings.glusterfs:false}) {
  resp.nodes.push({
    nodeType: "storage",
    count: 3,
    tag: ${settings.storage_tag:"2.0-7.2"},
    cluster: true,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    diskLimit: ${settings.st_diskLimit:100},
    nodeGroup: "storage",
    restartDelay: 10,
    isRedeploySupport: false,
    displayName: "GlusterFS"
  })
}

if (!${settings.glusterfs:false}) {
  resp.nodes.push({
    nodeType: "storage",
    count: 1,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    diskLimit: ${settings.st_diskLimit:100},
    nodeGroup: "storage",
    isRedeploySupport: false,
    displayName: "Storage"
  })
}

resp.nodes.push({
  nodeType: "mariadb-dockerized",
  tag: ${settings.sqldb_tag:"10.4.12"},
  flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
  fixedCloudlets: ${settings.db_fixedCloudlets:1},
  diskLimit: ${settings.db_diskLimit:10},
  count: db_count,
  nodeGroup: "sqldb",
  isRedeploySupport: false,
  restartDelay: 10,
  skipNodeEmails: true,
  cluster: {
    scheme: db_cluster,
    jps: "https://raw.githubusercontent.com/jelastic-jps/mysql-cluster/v2.0.0/addons/auto-clustering/auto-cluster.jps"
    db_user: "${globals.DB_USER}",
    db_pass: "${globals.DB_PASS}",
    is_proxysql: false,
    custom_conf: "${baseUrl}/configs/sqldb/wordpress.cnf"
  },
  env: {
    ON_ENV_INSTALL: "https://raw.githubusercontent.com/jelastic-jps/mysql-cluster/v2.0.0/addons/auto-clustering/auto-cluster.jps"
    SCHEME: db_cluster
    IS_PROXYSQL: false
  }  
});

if (${settings.ls-addon:false}) {
  resp.nodes.push({
    nodeType: "litespeedadc",
    tag: ${settings.bl_tag:"2.7"},
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    diskLimit: ${settings.bl_diskLimit:10},
    nodeGroup: "bl",
    restartDelay: 10,
    scalingMode: "STATEFUL",
    displayName: "Load balancer",
    addons: ["setup-site-url"],
    env: {
      WP_PROTECT: wpbfp,
      WP_PROTECT_LIMIT: 100
    }
  }, {
    nodeType: "litespeedphp",
    tag: ${settings.cp_tag:"5.4.6-php-7.4.3"},
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:16},
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    diskLimit: ${settings.cp_diskLimit:10},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    displayName: "AppServer",
    addons: ["setup-site-url"],
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true",
      WAF: "${settings.waf:false}",
      WP_PROTECT: "OFF"
    },
    volumes: [
      "/var/www/webroot/ROOT"
    ]
  })
}

if (!${settings.ls-addon:false}) {
  resp.nodes.push({
    nodeType: "nginx",
    tag: ${settings.bl_tag:"1.16.1"},
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    diskLimit: ${settings.bl_diskLimit:10},
    nodeGroup: "bl",
    restartDelay: 10,
    addons: ["setup-site-url"],
    scalingMode: "STATEFUL",
    displayName: "Load balancer"
  }, {
    nodeType: "nginxphp",
    tag: ${settings.cp_tag:"1.16.1-php-7.4.4"},
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:8},                  
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    diskLimit: ${settings.cp_diskLimit:10},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    displayName: "AppServer",
    addons: ["setup-site-url"],
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true"
    },
    volumes: [
      "/var/www/webroot/ROOT",
      "/var/www/webroot/.cache"
    ]
  })
}

return resp;

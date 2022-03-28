var wpbfp = '${settings.wp_protect}' == 'true' ? "THROTTLE" : "OFF";
var db_cluster = '${settings.galera}' == 'true' ? "galera" : "master";
var db_count = '${settings.galera}' == 'true' ? 3 : 2;
var nfs_protocol = '${settings.glusterfs}' == 'true' ? "GLUSTER" : "NFS4";

var resp = {
  result: 0,
  ssl: !!jelastic.billing.account.GetQuotas('environment.jelasticssl.enabled').array[0].value,
  nodes: []
}

if ('${settings.glusterfs:false}' == 'true') {
  resp.nodes.push({
    nodeType: "storage",
    count: 3,
    cluster: true,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    nodeGroup: "storage",
    restartDelay: 10,
    validation: {
      minCount: 3,
      maxCount: 3
    }
  })
} else {
  resp.nodes.push({
    nodeType: "storage",
    count: 1,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    nodeGroup: "storage",
    validation: {
      minCount: 1,
      maxCount: 1
    }
  })
}

resp.nodes.push({
  nodeType: "mariadb-dockerized",
  flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
  fixedCloudlets: ${settings.db_fixedCloudlets:1},
  count: db_count,
  nodeGroup: "sqldb",
  restartDelay: 10,
  skipNodeEmails: true,
  validation: {
    minCount: db_count,
    maxCount: db_count
  },
  cluster: {
    scheme: db_cluster,
    db_user: "${globals.DB_USER}",
    db_pass: "${globals.DB_PASS}",
    is_proxysql: false,
    custom_conf: "${baseUrl}/configs/sqldb/wordpress.cnf"
  },
  env: {
    SCHEME: db_cluster,
    DB_USER: "${globals.DB_USER}",
    DB_PASS: "${globals.DB_PASS}",
    IS_PROXYSQL: false
  }  
});

if ('${settings.ls-addon:false}'== 'true') {
  resp.nodes.push({
    nodeType: "litespeedadc",
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    nodeGroup: "bl",
    restartDelay: 10,
    env: {
      WP_PROTECT: wpbfp,
      WP_PROTECT_LIMIT: 100
    }
  }, {
    nodeType: "litespeedphp",
    engine: "php8.0",
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:16},
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    nodeGroup: "cp",
    restartDelay: 10,
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "false",
      WAF: "${settings.waf:false}",
      WP_PROTECT: "OFF"
    },      
    volumes: [
      "/var/www/webroot/ROOT"
    ]
  })
} else {
  resp.nodes.push({
    nodeType: "nginx",
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    nodeGroup: "bl",
    restartDelay: 10
  }, {
    nodeType: "nginxphp",
    engine: "php8.0",
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:8},                  
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    nodeGroup: "cp",
    restartDelay: 10,
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "false"
    },
    volumes: [
      "/var/www/webroot/ROOT"
    ]
  })
}

resp.nodes.push({
  nodeType: "redis",
  count: 1,
  flexibleCloudlets: ${settings.st_flexibleCloudlets:16},
  fixedCloudlets: ${settings.st_fixedCloudlets:1},
  nodeGroup: "nosqldb"
})

return resp;

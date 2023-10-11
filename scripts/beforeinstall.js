var wpbfp = '${settings.wp_protect}' == 'true' ? "THROTTLE" : "OFF";
var db_cluster = '${settings.galera}' == 'true' ? "galera" : "master";
var db_count = '${settings.galera}' == 'true' ? 3 : 2;

var resp = {
  result: 0,
  ssl: false,
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
    isRedeploySupport: false,
    validation: {
      minCount: 3,
      maxCount: 3
    }
  })
} else {
  resp.nodes.push({
    nodeType: "storage",
    count: '${settings.storage_nodes_count:1}',
    cluster: '${settings.is_storage_cluster:false}',
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    nodeGroup: "storage",
    isRedeploySupport: false,
    displayName: "Storage",
    validation: {
      minCount: '${settings.storage_nodes_count:1}',
      maxCount: '${settings.storage_nodes_count:1}'
    }
  })
}

if ('${settings.db_async_topology:true}' == 'true') {
  resp.nodes.push({
    nodeType: "mysql",
    flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
    fixedCloudlets: ${settings.db_fixedCloudlets:1},
    count: 1,
    nodeGroup: "sqldb",
    skipNodeEmails: true,
    cluster: false
  }, {
    nodeType: "proxysql",
    flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
    fixedCloudlets: ${settings.db_fixedCloudlets:1},
    count: 1,
    nodeGroup: "proxy",
    skipNodeEmails: true 
  }) 
} else {
  if ('${settings.is_db_cluster:true}' == 'true') {
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
        db_user: "${globals.db_user}",
        db_pass: "${globals.db_pass}",
        is_proxysql: false,
        custom_conf: "${baseUrl}/configs/sqldb/wordpress.cnf"
      }
    }) 
  } else {
    resp.nodes.push({
      nodeType: "mariadb-dockerized",
      flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
      fixedCloudlets: ${settings.db_fixedCloudlets:1},
      count: db_count,
      nodeGroup: "sqldb",
      restartDelay: 10,
      skipNodeEmails: true,
      cluster: false,
      validation: {
        minCount: db_count,
        maxCount: db_count
      }
    }) 
  }
}

if ('${settings.ls_addon:false}'== 'true') {
  resp.nodes.push({
    nodeType: "litespeedadc",
    extip: true,
    count: ${settings.bl_count:1},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    nodeGroup: "bl",
    restartDelay: 10,
    addons: ["cache-clean","setup-site-url"],
    displayName: "Load balancer",
    env: {
      WP_PROTECT: wpbfp,
      WP_PROTECT_LIMIT: 100,
      DEFAULT_CLUSTER: "FALSE"
    }
  }, {
    nodeType: "litespeedphp",
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:16},
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    addons: ["cache-clean","setup-site-url"],
    displayName: "AppServer",
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true",
      WAF: "${settings.waf:false}",
      WP_PROTECT: "OFF"
    }
  })
} else {
  resp.nodes.push({
    nodeType: "nginx",
    count: ${settings.bl_count:1},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    diskLimit: ${settings.bl_diskLimit:10},
    nodeGroup: "bl",
    restartDelay: 10,
    scalingMode: "STATEFUL",
    addons: ["cache-clean"],
    displayName: "Load balancer"
  }, {
    nodeType: "nginxphp",
    count: ${settings.cp_count:2},
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:8},                  
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    diskLimit: ${settings.cp_diskLimit:10},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    displayName: "AppServer",
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true"
    }
  })
}

return resp;

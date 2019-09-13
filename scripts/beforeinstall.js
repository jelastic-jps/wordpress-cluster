var resp = {
  result: 0,
  ssl: !!jelastic.billing.account.GetQuotas('environment.jelasticssl.enabled').array[0].value,
  nodes: [{
    nodeType: "mariadb-dockerized",
    tag: "10.3.16",
    count: 1,
    cloudlets: 16,
    nodeGroup: "sqldb",
    displayName: "Galera cluster",
    restartDelay: 5,
    env: {
      ON_ENV_INSTALL: "",
      JELASTIC_PORTS: "4567,4568,4444"
    }
  }, {
    nodeType: "storage",
    cloudlets: 8,
    nodeGroup: "storage",
    displayName: "Storage"
  }]
}

var envName = "${env.name}",
    bFireWallEnabled,
    outputRule,
    inputRule,
    rules,
    resp;

inputRule = {
    "direction": "INPUT",
    "name": name,
    "protocol": "ALL",
    "ports": ports,
    "src": "ALL",
    "priority": 1080,
    "action": "ALLOW"
};
outputRule = {
    "direction":'OUTPUT',
    "name":name,
    "protocol":'ALL',
    "ports":ports,
    "dst":'ALL',
    "priority":1000,
    "action":'ALLOW'
};

if (jelastic.environment.security) {
  resp = jelastic.billing.account.GetOwnerQuotas(appid, session, 'firewall.enabled');
  if (!resp || resp.result !== 0) return resp;
  bFireWallEnabled = resp.array[0] ? resp.array[0].value : 0;
  if (bFireWallEnabled) {
    resp = jelastic.environment.security.AddRule(envName, session, inputRule, nodeGroup);
    if (!resp || resp.result !== 0) return resp;
    return jelastic.environment.security.AddRule(envName, session, outputRule, nodeGroup);
  }
}

return {
    result: 0
}


var APPID = getParam("TARGET_APPID");

oQoutas = jelastic.billing.account.GetQuotas(APPID, session, ["environment.maxsamenodescount"]);

if (oQoutas.result != 0) {
    return oQoutas;
}

oRespTurnOn = jelastic.env.trigger.AddTrigger(APPID, session,'{"isEnabled":true,"name":"hs-add-nginx","nodeGroup":"cp","period":1,"condition":{"type":"GREATER","value":70,"resourceType":"CPU","valueType":"PERCENTAGES"},"actions":[{"type":"ADD_NODE","customData":{"limit":' + oQoutas.array[0].value + ',"count":1,"notify":true}}]}');

if (oRespTurnOn.result != 0) {
    return oRespTurnOn;
}

return jelastic.env.trigger.AddTrigger(APPID, session,'{"isEnabled":true,"name":"hs-add-nginx","nodeGroup":"cp","period":1,"condition":{"type":"LESS","value":20,"resourceType":"CPU","valueType":"PERCENTAGES"},"actions":[{"type":"REMOVE_NODE","customData":{"limit":2,"count":1,"notify":true}}]}');

var resp = jelastic.env.control.GetEnvInfo(targetEnv, session);
if (resp.result != 0) return resp;
var nodes = [];
for (var i = 0, n = resp.nodes; i < n.length; i++)
  n[i].nodeGroup == nodeGroup ? nodes.push('node' + n[i].address) : 0
resp = {result:0, onAfterReturn: {}};
resp.onAfterReturn['cmd['+ nodeGroup +']'] = 'echo '+ nodes.join(',');
return resp;

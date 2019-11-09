//@auth
//@req(nodeGroup, resourceType, cleanOldTriggers, loadGrowth)

var scaleUpLoadPeriod = 1,
    scaleDownLimit = getParam("scaleDownLimit") || 2,
    scaleDownLoadPeriod = 5;

var resp = jelastic.billing.account.GetQuotas('environment.maxsamenodescount');
if (resp.result != 0) return resp;
var scaleUpLimit = resp.array[0] && resp.array[0].value ? resp.array[0].value : 1000;

if (scaleUpLimit <= scaleDownLimit) return {result:0, warning: 'autoscaling triggers have not been added due to upLimit ['+scaleUpLimit+'] <= downLimit ['+scaleDownLimit+']'}

if (loadGrowth.toLowerCase() == "slow") {
    var scaleUpValue = 70,
        scaleDownValue = 20,
        scaleNodeCount = 1;
}

if (loadGrowth.toLowerCase() == "medium") {
    var scaleUpValue = 50,
        scaleDownValue = 20,
        scaleNodeCount = 1;
}

if (loadGrowth.toLowerCase() == "fast") {
    var scaleUpValue = 30,
        scaleDownValue = 10,
        scaleNodeCount = 2;
}

if (cleanOldTriggers) {
    var actions = ['ADD_NODE', 'REMOVE_NODE'];
    for (var i = 0; i < actions.length; i++){
        var array = jelastic.env.trigger.GetTriggers(appid, session, actions[i]).array;
        for (var j = 0; j < array.length; j++) jelastic.env.trigger.DeleteTrigger(appid, session, array[j].id);          
    }
}

resp = jelastic.env.trigger.AddTrigger('${env.envName}', session, 
    {
        "isEnabled": true,
        "name": "scale-up",
        "nodeGroup": nodeGroup,
        "period": scaleUpLoadPeriod,
        "condition": {
            "type": "GREATER",
            "value": scaleUpValue,
            "resourceType": resourceType,
            "valueType": "PERCENTAGES"
        },
        "actions": [
            {
                "type": "ADD_NODE",
                "customData": {
                    "limit": scaleUpLimit,
                    "count": scaleNodeCount,
                    "notify": true
                }
            }
        ]
    }
);

if (resp.result != 0) return resp;

resp = jelastic.env.trigger.AddTrigger('${env.envName}', session,
    {
        "isEnabled": true,
        "name": "scale-down",
        "nodeGroup": nodeGroup,
        "period": scaleDownLoadPeriod,
        "condition": {
            "type": "LESS",
            "value": scaleDownValue,
            "resourceType": resourceType,
            "valueType": "PERCENTAGES"
        },
        "actions": [
            {
                "type": "REMOVE_NODE",
                "customData": {
                    "limit": scaleDownLimit,
                    "count": 1,
                    "notify": true
                }
            }
        ]
    }
);

return resp;

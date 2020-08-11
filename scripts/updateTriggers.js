var SCALE = "scale-",
    DOWN = "down",
    UP = "up",
    scaleUp = SCALE + UP,
    scaleDown = SCALE + DOWN,
    addNode = "ADD_NODE",
    removeNode = "REMOVE_NODE",
    count = getParam('count'),
    ENV_NAME = "${env.name}",
    triggersToEdit = [],
    triggerActions,
    customData,
    triggers,
    upLimit,
    resp;

resp = jelastic.environment.trigger.GetTriggers(ENV_NAME, session, addNode + ";" + removeNode);
if (resp.result != 0) return resp;

triggers = resp.array;

for (var i = 0, n = triggers.length; i < n; i++) {
    if ([scaleUp, scaleDown].indexOf(String(triggers[i].name)) != -1) {
        triggerActions = triggers[i].actions;

        for (var l = 0, m = triggerActions.length; l < m; l++) {
            customData = triggerActions[l].customData;
            
            if (customData && customData.limit) {
                if (triggers[i].name == scaleUp) upLimit = customData.limit;

                if ((triggerActions[l].type == addNode && customData.limit < count) || triggerActions[l].type == removeNode) {
                    triggers[i].actions[l].customData.limit = count;

                    triggersToEdit.push({
                        scale: triggers[i].name.indexOf(UP) != -1 ? UP : DOWN,
                        trigger: triggers[i]
                    });
                }
            }
        }
    }
}

for (var i = 0, n = triggersToEdit.length; i < n; i++) {
    trigger = triggersToEdit[i].trigger;
    
    if (triggersToEdit[i].scale == DOWN && trigger.actions[0].customData.limit >= upLimit) trigger.actions[0].customData.limit = upLimit - 1;

    resp = jelastic.environment.trigger.EditTrigger(ENV_NAME, session, trigger.id, trigger);
    if (resp.result != 0) return resp;
}

return {result: 0};

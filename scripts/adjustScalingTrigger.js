var triggerNames = ["scale-up", "scale-down"],
    DOWN = "down",
    UP = "up",
    actions = ['ADD_NODE', 'REMOVE_NODE'],
    cpCount = getParam('cpCount'),
    ENV_NAME = "${env.name}",
    triggersToEdit = [],
    triggerActions,
    customData,
    triggers,
    upLimit,
    resp;
    

resp = jelastic.environment.trigger.GetTriggers(ENV_NAME, session, actions[0] + ";" + actions[1]);
if (resp.result != 0) return resp;

triggers = resp.array;

for (var i = 0, n = triggers.length; i < n; i++) {

    if (triggerNames.indexOf(String(triggers[i].name)) != -1) {
        triggerActions = triggers[i].actions;

        for (var l = 0, m = triggerActions.length; l < m; l++) {
            customData = triggerActions[l].customData;
            
            if (customData && customData.limit) {
                if (triggers[i].name == triggerNames[0]) upLimit = customData.limit;

                if ((triggerActions[l].type == actions[0] && customData.limit < cpCount) || triggerActions[l].type == actions[1]) {
                    triggers[i].actions[l].customData.limit = cpCount;

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
    
    if (triggersToEdit[i].scale == DOWN && Number(trigger.actions[0].customData.limit) >= upLimit) trigger.actions[0].customData.limit = Number(upLimit) - 1;

    resp = jelastic.environment.trigger.EditTrigger(ENV_NAME, session, trigger.id, trigger);
    if (resp.result != 0) return resp;
}

return {result: 0};

import com.hivext.api.Response;
import org.yaml.snakeyaml.Yaml;
import com.hivext.api.core.utils.Transport;

var cdnAppid = "c05ffa5b45628a2a0c95467ebca8a0b4test";
var lsAppid = "9e6afcf310004ac84060f90ff41a5aba";
var isCDN = jelastic.dev.apps.GetApp(cdnAppid);
var isLS = jelastic.dev.apps.GetApp(lsAppid);

//checking quotas
var perEnv = "environment.maxnodescount",
    maxEnvs = "environment.maxcount",
    perNodeGroup = "environment.maxsamenodescount",
    maxCloudletsPerRec = "environment.maxcloudletsperrec",
    extIP = "environment.externalip.enabled",
    extIPperEnv = "environment.externalip.maxcount",
    extIPperNode = "environment.externalip.maxcount.per.node";

var nodesPerEnvWO_Bl = 9,
    nodesPerEnvWO_GlusterFS = 7,
    nodesPerEnvMin = 6,
    nodesPerGroupMin = 2,
    maxCloudlets = 16,
    markup = "", cur = null, prod = true, le_markup = "", le = true, warn_text = "";

var hasCollaboration = (parseInt("${fn.compareEngine(7.0)}", 10) >= 0),
    quotas = [], group;

if (hasCollaboration) {
    quotas = [
      { quota : { name: perEnv }, value: parseInt('${quota.environment.maxnodescount}', 10) },
      { quota : { name: maxEnvs }, value: parseInt('${quota.environment.maxcount}', 10) },
      { quota : { name: perNodeGroup }, value: parseInt('${quota.environment.maxsamenodescount}', 10) },
      { quota : { name: maxCloudletsPerRec }, value: parseInt('${quota.environment.maxcloudletsperrec}', 10) },
      { quota : { name: extIP }, value: parseInt('${quota.environment.externalip.enabled}', 10) },
      { quota : { name: extIPperEnv }, value: parseInt('${quota.environment.externalip.maxcount}', 10) },
      { quota : { name: extIPperNode }, value: parseInt('${quota.environment.externalip.maxcount.per.node}', 10) }
    ];
    group = { groupType: '${account.groupType}' };
} else {      
    quotas.push(jelastic.billing.account.GetQuotas(perEnv).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(maxEnvs).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(perNodeGroup).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(maxCloudletsPerRec).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(extIP).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(extIPperEnv).array[0]);
    quotas.push(jelastic.billing.account.GetQuotas(extIPperNode).array[0]);
    group = jelastic.billing.account.GetAccount(appid, session);
}

var settings = jps.settings;
var fields = {};
for (var i = 0, field; field = jps.settings.fields[i]; i++)
  fields[field.name] = field;

for (var i = 0; i < quotas.length; i++){
    var q = quotas[i], n = toNative(q.quota.name);

    if (n == maxCloudletsPerRec && maxCloudlets > q.value){
        markup = err(q, "required", maxCloudlets);
        prod  = false; break;
    }

    if (n == perEnv && nodesPerEnvMin > q.value){
        markup = err(q, "required", nodesPerEnvMin);
        prod = false; break;
    }

    if (n == perNodeGroup && nodesPerGroupMin > q.value){
        markup = err(q, "required", nodesPerGroupMin);
        prod = false; break;
    }

    if (n == extIP &&  !q.value){
      le_markup = err(q, "required", 1);
      le  = false; break;
    }
  
    if (n == extIPperEnv && q.value < 2){
      le_markup = err(q, "required", 2);
      le = false; break;
    }

    if (n == extIPperNode && q.value < 1){
      le_markup = err(q, "required", 1);
      le = false; break;
    }

    if (isLS.result == 0 || isLS.result == Response.PERMISSION_DENIED) {  
      fields["ls-addon"].hidden = false;
      fields["ls-addon"].value = true;
    } else {
      fields["ls-addon"].hidden = true;
      fields["ls-addon"].value = false;
      fields["ls-addon"].showIf = null;
    }

    if (isCDN.result == 0 || isCDN.result == Response.PERMISSION_DENIED) {
      fields["cdn-addon"].hidden = false;
      fields["cdn-addon"].value = true;
    } else {
      fields["cdn-addon"].hidden = true;
      fields["cdn-addon"].value = false;
    }

    if (n == perEnv && nodesPerEnvWO_GlusterFS  == q.value){
      disableFields(["glusterfs"]);
      fields["bl_count"].value = 1;
      setDisplayWarning("displayfield", "Some advanced features are not available.", 25);
      markup = err(q, "required", 8);
      warn_text = "GlusterFS is not available. Only one load balancer will be installed. " + markup + "Please upgrade your account.";
      addDisplayWarning(warn_text, 30);
    }

    if (n == perEnv && q.value == 8){
      disableFields(["glusterfs"]);
      fields["bl_count"].value = 2;
      setDisplayWarning("displayfield", "Some advanced features are not available.", 25);
      markup = err(q, "required", perEnv + 1);
      warn_text = "GlusterFS is not available. " + markup + "Please upgrade your account.";
      addDisplayWarning(warn_text, 30);
    }

    if (n == perEnv && nodesPerEnvWO_Bl  == q.value){
      fields["bl_count"].value = 1;
      markup = err(q, "required", nodesPerEnvWO_Bl + 1);
      warn_text = "Only one load balancer will be installed. " + markup + "Please upgrade your account.";
      addDisplayWarning(warn_text, 30);
    }

    if (n == perNodeGroup && nodesPerGroupMin  == q.value){
      disableFields(["glusterfs", "galera"]);
      setDisplayWarning("displayfield", "Some advanced features are not available.", 25);
      markup = err(q, "required", nodesPerGroupMin + 1);
      warn_text = "GlusterFS and Galera cluster are not available. " + markup + "Please upgrade your account.";
      addDisplayWarning(warn_text, 30);
    }

    if (n == perEnv && nodesPerEnvMin  == q.value){
      disableFields(["glusterfs", "galera"]);
      fields["bl_count"].value = 1;
      setDisplayWarning("displayfield", "Some advanced features are not available.", 25);
      markup = err(q, "required", nodesPerEnvMin + 1);
      warn_text = "GlusterFS and Galera cluster are not available. Only one load balancer will be installed." + markup + "Please upgrade your account.";
      addDisplayWarning(warn_text, 30);
    }
}

if (!le) {
  disableFields(["le-addon"]);
  setDisplayWarning("displayfield", "Some advanced features are not available.", 25);
  warn_text = warn_text + " Lets Encrypt is not available. " + le_markup + "Please upgrade your account.";
  addDisplayWarning(warn_text, 30);
}

if (!prod || group.groupType == 'trial') {
  disableFields(["ls-addon", "loadGrowth", "galera", "glusterfs", "le-addon", "cdn-addon", "mu-addon", "woocommerce"]);    
  setDisplayWarning("displayfield", "Advanced features are not available.", 25);
  warn_text = (group.groupType == 'trial')
    ? "WordPress cluster is not available for " + group.groupType + ". Please upgrade your account."
    : "WordPress cluster is not available. " + markup + "Please upgrade your account.";
  addDisplayWarning(warn_text, 30);

  settings.fields.push(
    {"type": "compositefield","height": 0,"hideLabel": true,"width": 0,"items": [{"height": 0,"type": "string","required": true}]}
  );
}

function disableFields(names) {
  for (var i = 0; i < names.length; i++) {
    if (fields[names[i]]) {
      fields[names[i]].value = false;
      fields[names[i]].disabled = true;
    }
  }
}

function addDisplayWarning(warn_text, height) {
  settings.fields.push(
    {"type": "displayfield", "cls": "warning", "height": height, "hideLabel": true, "markup": warn_text}
  );
}

function setDisplayWarning(field, warn_text, height) {
  fields[field].markup = warn_text;
  fields[field].cls = "warning";
  fields[field].hideLabel = true;
  fields[field].hidden = false;
  fields[field].height = height;
}

function err(e, text, cur){
  var m = (e.quota.description || e.quota.name) + " - " + e.value + ", " + text + " - " + cur + ". ";
  return m;
}

return {
    result: 0,
    settings: settings
};

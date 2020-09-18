import com.hivext.api.Response;
import org.yaml.snakeyaml.Yaml;
import com.hivext.api.core.utils.Transport;

var cdnAppid = "c05ffa5b45628a2a0c95467ebca8a0b4";
var lsAppid = "9e6afcf310004ac84060f90ff41a5aba";
var group = jelastic.billing.account.GetAccount(appid, session);
var isCDN = jelastic.dev.apps.GetApp(cdnAppid);
var isLS = jelastic.dev.apps.GetApp(lsAppid);

//checking quotas
var perEnv = "environment.maxnodescount",
      maxEnvs = "environment.maxcount",
      perNodeGroup = "environment.maxsamenodescount",
      maxCloudletsPerRec = "environment.maxcloudletsperrec";
var nodesPerEnvWO_Bl = 9,
      nodesPerEnvWO_GlusterFS = 7,
      nodesPerEnvMin = 6,
      nodesPerGroupMin = 2,
      maxCloudlets = 16,
      markup = "", cur = null, text = "used", prod = true;

var settings = jps.settings;
var fields = {};
for (var i = 0, field; field = jps.settings.fields[i]; i++)
  fields[field.name] = field;

var quotas = jelastic.billing.account.GetQuotas(perEnv + ";"+maxEnvs+";" + perNodeGroup + ";" + maxCloudletsPerRec ).array;
var group = jelastic.billing.account.GetAccount(appid, session);
for (var i = 0; i < quotas.length; i++){
    var q = quotas[i], n = toNative(q.quota.name);

    if (n == maxCloudletsPerRec && maxCloudlets > q.value){
        err(q, "required", maxCloudlets, true);
        prod  = false; 
    }
    
    if (n == perEnv && nodesPerEnvMin > q.value){
        if (!markup) err(q, "required", nodesPerEnvMin, true);
        prod = false;
    }

   if (n == perNodeGroup && nodesPerGroupMin > q.value){
        if (!markup) err(q, "required", nodesPerGroupMin, true);
        prod = false;
    }
    
    if (n == perEnv && nodesPerEnvMin  == q.value){
      fields["glusterfs"].value = false;
      fields["glusterfs"].disabled = true;
      fields["galera"].value = false;
      fields["galera"].disabled = true;
      fields["bl_count"].value = 1;
      fields["displayfield"].markup = "Some advanced features are not available. Please upgrade your account.";
      fields["displayfield"].cls = "warning";
      fields["displayfield"].hideLabel = true;
      fields["displayfield"].height = 25;      
    }

    if (n == perEnv && nodesPerEnvWO_GlusterFS  == q.value){
      fields["glusterfs"].value = false;
      fields["glusterfs"].disabled = true;
      fields["bl_count"].value = 1;
      fields["displayfield"].markup = "Some advanced features are not available. Please upgrade your account.";
      fields["displayfield"].cls = "warning";
      fields["displayfield"].hideLabel = true;
      fields["displayfield"].height = 25;      
    }

    if (n == perEnv && q.value == 8){
      fields["glusterfs"].value = false;
      fields["glusterfs"].disabled = true;
      fields["bl_count"].value = 2;
      fields["displayfield"].markup = "Some advanced features are not available. Please upgrade your account.";
      fields["displayfield"].cls = "warning";
      fields["displayfield"].hideLabel = true;
      fields["displayfield"].height = 25;
    }
    
    if (n == perEnv && nodesPerEnvWO_Bl  == q.value){
      fields["bl_count"].value = 1;      
    }    
 
    if (n == perNodeGroup && nodesPerGroupMin  == q.value){
      fields["glusterfs"].value = false;
      fields["glusterfs"].disabled = true;
      fields["galera"].value = false;
      fields["galera"].disabled = true;
      fields["displayfield"].markup = "Some advanced features are not available. Please upgrade your account.";
      fields["displayfield"].cls = "warning";
      fields["displayfield"].hideLabel = true;
      fields["displayfield"].height = 25;
    }

    if (isLS.result == 0 || isLS.result == Response.PERMISSION_DENIED) {  
      fields["ls_addon"].hidden = false;
      fields["ls_addon"].value = true;
    } else {
      fields["ls_addon"].hidden = true;
      fields["ls_addon"].value = false;
      fields["ls_addon"].showIf = null;
    }
  
    if (isCDN.result == 0 || isCDN.result == Response.PERMISSION_DENIED) {
      fields["cdn_addon"].hidden = false;
      fields["cdn_addon"].value = true;
    } else {
      fields["cdn_addon"].hidden = true;
      fields["cdn_addon"].value = false;
    }
    
    var extIP = jelastic.billing.account.GetQuotas('environment.externalip.enabled');
    var extIPperEnv = jelastic.billing.account.GetQuotas('environment.externalip.maxcount');
    var extIPperNode = jelastic.billing.account.GetQuotas('environment.externalip.maxcount.per.node');

    if ((extIP.result == 0 && extIP.array[0].value) && (extIPperEnv.result == 0 && extIPperEnv.array[0].value >= 2) && (extIPperNode.result == 0 && extIPperNode.array[0].value >= 1)) {
      fields["le_addon"].disabled = false;
      fields["le_addon"].value = true;
    }
}

if (!prod || group.groupType == 'trial') {
  fields["ls_addon"].disabled = true;
  fields["ls_addon"].value = false;
  fields["loadGrowth"].disabled = true;
  fields["galera"].disabled = true;
  fields["galera"].value = false;
  fields["glusterfs"].disabled = true;
  fields["glusterfs"].value = false;
  fields["le_addon"].disabled = true;
  fields["le_addon"].value = false;
  fields["cdn_addon"].disabled = true;
  fields["cdn_addon"].value = false;
  fields["mu_addon"].disabled = true;
  fields["displayfield"].markup = "Advanced features are not available.";
  fields["displayfield"].cls = "warning";
  fields["displayfield"].hideLabel = true;
  fields["displayfield"].height = 25;
  fields["bl_count"].markup = "WordPress cluster is not available. " + markup + "Please upgrade your account.";
  if (group.groupType == 'trial')
    fields["bl_count"].markup = "WordPress cluster is not available for " + group.groupType + ". Please upgrade your account.";
  fields["bl_count"].cls = "warning";
  fields["bl_count"].hidden = false;
  fields["bl_count"].height = 30;
  
  
  settings.fields.push(
    {"type": "compositefield","height": 0,"hideLabel": true,"width": 0,"items": [{"height": 0,"type": "string","required": true}]}
  );
}

return {
    result: 0,
    settings: settings
};

function err(e, text, cur, override){
  var m = (e.quota.description || e.quota.name) + " - " + e.value + ", " + text + " - " + cur + ". ";
  if (override) markup = m; else markup += m;
}

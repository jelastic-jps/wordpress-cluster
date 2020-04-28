import com.hivext.api.Response;
import org.yaml.snakeyaml.Yaml;
import com.hivext.api.core.utils.Transport;

var cdnAppid = "c05ffa5b45628a2a0c95467ebca8a0b4";
var lsAppid = "9e6afcf310004ac84060f90ff41a5aba";
var group = jelastic.billing.account.GetAccount(appid, session);
var isCDN = jelastic.dev.apps.GetApp(cdnAppid);
var isLS = jelastic.dev.apps.GetApp(lsAppid);

var sameNodes = "environment.maxsamenodescount";
var maxNodes = "environment.maxnodescount";
var minEnvNodes = 7, minEnvLayerNodes = 3, quotaName, quotaValue,  quotaText = "", 
    quota = jelastic.billing.account.GetQuotas(maxNodes + ";" + sameNodes).array || [];
    
for (var i = 0, n = quota.length; i < n; i++) {
    quotaName = quota[i].quota.name;
    quotaValue = quota[i].value;

    if (quotaName == maxNodes && quotaValue < minEnvNodes) {
        quotaText = "Quota limits: " + quotaName + " = " + quotaValue + ". Min value is " + minEnvNodes + ".  Please upgrade your account.";
        continue;
    }

    if (quotaName == sameNodes && quotaValue < minEnvLayerNodes) {
        quotaText = "Quota limits: " + quotaName + " = " + quotaValue + ". Min value is " + minEnvLayerNodes + ".  Please upgrade your account.";
        continue;
    }
}

var settings = jps.settings;
var fields = {};
for (var i = 0, field; field = jps.settings.fields[i]; i++)
  fields[field.name] = field;

if (group.groupType == 'trial') {

  fields["ls-addon"].value = false;
  fields["wp_protect"].value = false;
  fields["waf"].value = false;
  fields["cdn-addon"].value = false;
  fields["le-addon"].value = false;
  fields["glusterfs"].value = false;
  fields["glusterfs"].disabled = true;
  
  if (isLS.result == 0 || isLS.result == Response.PERMISSION_DENIED) {  
    fields["ls-addon"].disabled = true;
    fields["wp_protect"].disabled = true;
    fields["waf"].disabled = true;
  } else {
    fields["ls-addon"].hidden = true;
    fields["wp_protect"].hidden = true;
    fields["waf"].hidden = true;
  }
  
  if (isCDN.result == 0 || isCDN.result == Response.PERMISSION_DENIED) {
    fields["cdn-addon"].disabled = true;
  } else {
    fields["cdn-addon"].hidden = true;
  }
    
  fields["displayfield"].markup = "Not available for " + group.groupType + " account. Please upgrade your account.";
  fields["displayfield"].cls = "warning";
  fields["displayfield"].hideLabel = true;
    
} else {
  
  if (isLS.result == 0 || isLS.result == Response.PERMISSION_DENIED) {  
    fields["ls-addon"].value = true;
  } else {
    fields["ls-addon"].hidden = true;
    fields["ls-addon"].value = false;
  }
  
  if (isCDN.result == 0 || isCDN.result == Response.PERMISSION_DENIED) {
     fields["cdn-addon"].value = true;
  } else {
    fields["cdn-addon"].hidden = true;
    fields["cdn-addon"].value = false;
  }
}

if (quotaText) {
    settings.fields.push(
        {"type": "displayfield", "cls": "warning", "height": 30, "hideLabel": true, "markup": quotaText},
        {"type": "compositefield","height": 0,"hideLabel": true,"width": 0,"items": [{"height": 0,"type": "string","required": true}]}
    );
}

return {
    result: 0,
    settings: settings
};

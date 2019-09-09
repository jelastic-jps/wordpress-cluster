**Environment 1**: [${globals.PROTOCOL}://${settings.envName}.${globals.REGION-0}/](${globals.PROTOCOL}://${settings.envName}.${globals.REGION-0}/)   
**Environment 2**: [${globals.PROTOCOL}://${settings.envName}-1.${globals.REGION-1}/](${globals.PROTOCOL}://${settings.envName}-1.${globals.REGION-1}/)

**CDN Endpoint URL**:  [${globals.CDN_URL}](${globals.CDN_URL})

Use the following credentials to access the admin panel:

**Admin Panel**: [${globals.PROTOCOL}://${settings.envName}.${globals.REGION-0}/wp-admin/](${globals.PROTOCOL}://${settings.envName}.${globals.REGION-0}/wp-admin/)
**Login**: ${user.email}
**Password**: ${globals.WP_ADMIN_PASS}

Manage the database nodes using the next credentials:

**phpMyAdmin Panel 1**: [https://${settings.envName}.${globals.REGION-0}:8443/](https://${settings.envName}.${globals.REGION-0}:8443/)   
**phpMyAdmin Panel 2**: [https://${settings.envName}-1.${globals.REGION-1}:8443/](https://${settings.envName}-1.${globals.REGION-1}:8443/)

**Username**: ${globals.DB_USER}    
**Password**: ${globals.DB_PASS}  


**WordPress environment**: [${globals.PROTOCOL}://${settings.envName}.${globals.DOMAIN}/](${globals.PROTOCOL}://${settings.envName}.${globals.DOMAIN}/)

**CDN Endpoint URL**:  [${globals.CDN_URL}](${globals.CDN_URL})

Use the following credentials to access the admin panel:

**Admin Panel**: [${globals.PROTOCOL}://${settings.envName}.${globals.DOMAIN}/wp-admin/](${globals.PROTOCOL}://${settings.envName}.${globals.DOMAIN}/wp-admin/)  
**Login**: ${user.email}  
**Password**: ${globals.WP_ADMIN_PASS}  

Manage the database nodes using the next credentials:

**phpMyAdmin Panel**: [https://node${globals.masterDB-ID}-${settings.envName}.${globals.DOMAIN}/](https://node${globals.masterDB-ID}-${settings.envName}.${globals.DOMAIN}/)  
**Username**: ${globals.DB_USER}    
**Password**: ${globals.DB_PASS}  


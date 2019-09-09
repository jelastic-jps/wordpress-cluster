**WordPress environment**: [${globals.PROTOCOL}://${settings.envName}.${globals.REGION}/](${globals.PROTOCOL}://${settings.envName}.${globals.REGION}/)

Use the following credentials to access the admin panel:

**Admin Panel**: [${globals.PROTOCOL}://${settings.envName}.${globals.REGION}/wp-admin/](${globals.PROTOCOL}://${settings.envName}.${globals.REGION}/wp-admin/)  
**Login**: ${user.email}  
**Password**: ${globals.WP_ADMIN_PASS}  

Manage the database nodes using the next credentials:

**phpMyAdmin Panel**: [https://node${globals.masterDB-ID}-${settings.envName}.${globals.REGION}/](https://node${globals.masterDB-ID}-${settings.envName}.${globals.REGION}/)  
**Username**: ${globals.DB_USER}    
**Password**: ${globals.DB_PASS}  


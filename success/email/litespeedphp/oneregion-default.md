**WordPress environment**: [${globals.PROTOCOL}://${env.domain}/](${globals.PROTOCOL}://${env.domain}/)

Use the following credentials to access the admin panel:

**Admin Panel**: [${globals.PROTOCOL}://${env.domain}/wp-admin/](${globals.PROTOCOL}://${env.domain}/wp-admin/)  
**Login**: ${user.email}  
**Password**: ${globals.WP_ADMIN_PASS}  

Use the following credentials to access the LiteSpeed ADC admin console:

**Admin Console**: [https://node${nodes.bl.master.id}-${env.domain}:4848](https://node${nodes.bl.master.id}-${env.domain}:4848)  
**Login**: admin  
**Password**: ${globals.LS_ADMIN_PASS}  

Use the following credentials to access the LiteSpeed WEB Server admin console:

**Admin Console**: [https://node${nodes.cp.master.id}-${env.domain}:4848](https://node${nodes.cp.master.id}-${env.domain}:4848)  
**Login**: admin  
**Password**: ${globals.LS_ADMIN_PASS}  

Manage the database nodes using the next credentials:

**phpMyAdmin Panel**: [https://node${nodes.sqldb.master.id}-${env.domain}/](https://node${nodes.sqldb.master.id}-${env.domain}/)  
**Username**: ${globals.DB_USER}    
**Password**: ${globals.DB_PASS}  


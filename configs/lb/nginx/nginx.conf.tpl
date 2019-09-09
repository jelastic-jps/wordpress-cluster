######## HTTP SECTION PROTOTYPE ########

http {
	server_tokens off ;
        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        set_real_ip_from  192.168.0.0/16;
        set_real_ip_from  10.0.0.0/8;
        set_real_ip_from  172.16.0.0/16;
        real_ip_header    X-Forwarded-For;
        real_ip_recursive on;

        log_format main
        '"$http_x_forwarded_for" - $remote_user [$time_local] '
                '"$request" $status $bytes_sent '
                '"$http_referer" "$http_user_agent" '
                '"$gzip_ratio"';

        client_header_timeout 10m;
        client_body_timeout 10m;
        send_timeout 10m;
        client_max_body_size 50m;
        
        proxy_buffering off;

        connection_pool_size 256;
        client_header_buffer_size 1k;
        large_client_header_buffers 4 2k;
        request_pool_size 4k;

        gzip on;
        gzip_min_length 1100;
        gzip_buffers 4 8k;
        gzip_types text/plain;

        output_buffers 1 32k;
        postpone_output 1460;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;

        keepalive_timeout 75 20;

        ignore_invalid_headers on;

    map $upstream_addr        $group {
        default               "";
    ### MAPPING FOLLOWS HERE ###
    ### ~XXX\.XXX\.XXX\.XXX\:XX$   $GROUPNAME; ### MAPPROTO ### This is mappings prototype line, do not remove this!
    }

    ### DEFAULT UPSTREAM FOLLOWS HERE ###
    upstream default_upstream{
    ### server XXX.XXX.XXX.XXX; ### $GROUPNAME ### DEFUPPROTO ###

    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /license.txt HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;

    sticky path=/; keepalive 100; }

    ### UPSTREAMS LIST FOLLOWS HERE ###
        #upstream nodes{ server XXX.XXX.XXX.XXX; server 127.0.0.1:8001 backup # UPSTREAMPROTO # This is upstream prototype line, do not remove this! }


        #GFADMIN

        server {
                listen *:80;
                server_name  localhost;

                access_log /var/log/nginx/localhost.access_log main;
                error_log /var/log/nginx/localhost.error_log info;

                proxy_temp_path /var/nginx/tmp/;
                proxy_connect_timeout 10s;

                error_page   500 502 503 504  /50x.html;

                proxy_next_upstream error timeout http_500;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Host $http_host;
                proxy_set_header X-Forwarded-For $http_x_forwarded_for;
                proxy_set_header X-URI $uri;
                proxy_set_header X-ARGS $args;
                proxy_set_header Refer $http_refer;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";

                location = /50x.html {
                        root   html;
                }

                location / {
                        if ($cookie_SRVGROUP ~ group|common) {
                                proxy_pass http://$cookie_SRVGROUP;
                                error_page   500 502 503 504 = @rescue;
                        }

                        if ($cookie_SRVGROUP !~ group|common) {
                                add_header Set-Cookie "SRVGROUP=$group; path=/";
                        }
                        proxy_pass http://default_upstream;
                        add_header Set-Cookie "SRVGROUP=$group; path=/";
                }

                location @rescue {
                        proxy_pass http://default_upstream;
                        add_header Set-Cookie "SRVGROUP=$group; path=/";
                }

                location /status {
                        check_status;
                        access_log   off;
                }
                #USERLOCATIONS
        }

 include /etc/nginx/conf.d/*.conf;

}

######## TCP SECTION PROTOTYPE ########

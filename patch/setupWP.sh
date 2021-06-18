jpsType: update
name: WP script deploy
baseUrl: https://raw.githubusercontent.com/jelastic-jps/wordpress-cluster/v2.0.0/scripts
onInstall:
    - cmd[${nodes.cp.master.id}]: |- 
        [ ! -d $HOME/bin ] && mkdir $HOME/bin
        curl -o $HOME/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x $HOME/bin/wp
        echo "export PATH=$PATH:$HOME/bin/" >> $HOME/.bash_profile
        wget ${baseUrl}/setupWP.sh?_r=${fn.random} -O ~/bin/setupWP.sh &>> /var/log/run.log
        echo $HOME/bin;
    - cmd[${nodes.cp.master.id}]:
        echo ${response.out} >>  /etc/jelastic/redeploy.conf;
      user: root

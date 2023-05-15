#!/bin/sh
sudo cp ews.service /etc/systemd/system/ews.service
sudo systemctl enable ews
sudo systemctl start ews
systemctl status ews

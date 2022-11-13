#/usr/bin/env bash

source /home/oem/.bashrc

cd $(dirname $0)

npx yarn workspace emopop run dev
# yarn workspace emopop run serve


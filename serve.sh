#!/usr/bin/env bash

source /home/oem/.bashrc

cd $(dirname $0)

npx yarn workspace emopop run dev
# yarn workspace emopop run serve

# why `read a` here:
# https://www.linuxquestions.org/questions/linux-desktop-74/desktop-entry-to-run-script-file-in-terminal-fails-4175529714/
read a


#!/bin/bash
rm skills/Skills.xpi
cd skills
zip -Zs -r Skills.xpi ./* -x TODO.txt

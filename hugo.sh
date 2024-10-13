#!/bin/bash

if ! command -v "hugo" &> /dev/null
then
    echo "Error: hugo is not installed or not found in PATH. Please check installation script"
    exit 1
fi

echo "Transpiling..."
git pull
hugo --gc --minify --baseURL="https://kaustubhpatange.com/"

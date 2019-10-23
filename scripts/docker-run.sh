#!/bin/sh
rm -rf ./docs
docker run -v "$(pwd)"/docs:/root/docs appiumio/docs:latest
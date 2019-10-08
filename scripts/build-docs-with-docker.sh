docker build . -t appium-docs
docker create -ti --name dummy appium-docs bash
rm -rf ./docs
docker cp dummy:/root/docs/ ./
docker rm -f dummy
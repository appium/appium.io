FROM node:14-alpine3.14
WORKDIR '/root'
RUN apk add git python3 python3-dev py-pip gcc musl-dev
COPY ./package.json ./
RUN pip3 install mkdocs==1.1
RUN npm install
VOLUME docs/ ./docs/
COPY . .
CMD ["npm", "run", "build:docs:docker"]

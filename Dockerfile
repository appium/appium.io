FROM node:12.22.1-alpine3.11
WORKDIR '/root'
RUN apk add git python2 py-pip
COPY ./package.json ./
RUN pip install mkdocs==0.17.0
RUN npm install
VOLUME docs/ ./docs/
COPY . .
CMD ["npm", "run", "build:docs:docker"]

FROM node:alpine
WORKDIR '/root'
RUN apk add git python2 py-pip
COPY ./package.json ./
RUN pip install mkdocs==0.16.3
RUN npm install
VOLUME docs/ ./docs/
COPY . .
CMD ["npm", "run", "build:docs:docker"]

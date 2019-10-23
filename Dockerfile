FROM node:alpine
WORKDIR '/root'
RUN apk add git
RUN apk add python2
RUN apk add py-pip
COPY ./package.json ./
RUN pip install mkdocs==0.16.3
RUN npm install
VOLUME docs/ ./docs/
COPY . .
CMD ["npm", "run", "build:docs:docker"]

FROM node:alpine
WORKDIR '/root'
RUN apk add ruby
RUN apk add ruby-dev
RUN apk add git
ENV BUNDLER_VERSION 2.0.1
RUN gem install --no-rdoc --no-ri bundler
RUN apk add python2
RUN apk add py-pip
COPY ./package.json ./
RUN pip install mkdocs==0.16.3
RUN npm install
COPY . .
RUN npx babel-node scripts/repo.js

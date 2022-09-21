FROM node:alpine

COPY . /home/node/app

CMD node /home/node/app/app.js

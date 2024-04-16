FROM node
WORKDIR /usr/app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 8087
CMD [ "npm", "start" ]
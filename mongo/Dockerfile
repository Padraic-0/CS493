FROM node
ENV MONGO_DB_NAME=new_db
ENV MONGO_USER=user
ENV MONGO_PASSWORD=password
WORKDIR /usr/app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
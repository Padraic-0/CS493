FROM node
ENV MYSQL_HOST=proj1-mysql-server-1
#ENV MYSQL_PORT=3306
#ENV MYSQL_DATABASE=api_app
#ENV MYSQL_USER=api_app
#ENV MYSQL_PASSWORD=password
WORKDIR /usr/app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 8087
CMD [ "npm", "start" ]
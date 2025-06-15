FROM node:latest

WORKDIR /app

COPY . .

RUN npm install

#RUN npx prisma generate

# EXPOSE 3000
# EXPOSE 5555

CMD [ "npm", "run", "dev" ]

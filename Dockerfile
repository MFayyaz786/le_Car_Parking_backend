FROM alpine
WORKDIR /app
COPY . .
RUN apk update && apk add nodejs npm && \
    npm install && \
    npm install --global nodemon &&\
    apk add --no-cache bash
EXPOSE 3019
CMD ["npm","start"]
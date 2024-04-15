#!/bin/sh

status() {
    printf "\n==========\n"
    printf "%s\n" "$1"
    printf -- "-------------\n"
}

status 'GET business-by-id should return seccuess'
curl http://localhost:3000/businesses/9999

curl -v -X PUT \
    -H 'Content-Type: application/json' \
    -d '{"starRathing": "1", "dollarRating": "1", "review" : "Do not like"}'
    \
    http:localhost:3000/reviews?
#!/bin/bash

status() {
    printf "\n=====================================================\n"
    printf "%s\n" "$1"
    printf -- "-----------------------------------------------------\n"
}

status "Create a new business"
curl -X POST http://localhost:8087/businesses -d '{
    "name": "Paddys Pizza",
    "address": "123 Main St",
    "city": "Bend",
    "state": "OR",
    "zip": "97701",
    "phone": "541-555-1234",
    "category": "Pizza",
    "subcategories": "Microwaved",
    "owner_id": "1",
    "owner": "Paddy"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Update an existing business"
curl -X PUT http://localhost:8087/businesses/0 -d '{
    "owner_id": "1",
    "name": "Paddys New Pizza Place"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Update an existing business FAIL missing param"
curl -X PUT http://localhost:8087/businesses/0 -d '{
    "name": "Paddys New Pizza Place"
}' -H 'Content-Type: application/json'
echo
status "Get a business"
curl -X GET http://localhost:8087/businesses/0 | json_pp -json_opt pretty,canonical
echo
status "Get a business FAIL missing param"
curl -X GET http://localhost:8087/businesses/0 | json_pp -json_opt pretty,canonical
echo
status "Get all businesses"
curl -X GET http://localhost:8087/businesses | json_pp -json_opt pretty,canonical
echo
status "Post a review for a business"
curl -X POST http://localhost:8087/businesses/reviews -d '{
    "business_id": "0",
    "author": "John Doe",
    "author_id": "2",
    "review": "Great pizza!",
    "star": "5",
    "cost": "$$"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Post a review for a business FAIL only one review allowed"
curl -X POST http://localhost:8087/businesses/reviews -d '{
    "business_id": "0",
    "author": "John Doe",
    "author_id": "2",
    "review": "Great pizza!",
    "star": "5",
    "cost": "$$"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Post a review for a business FAIL missing param"
curl -X POST http://localhost:8087/businesses/reviews -d '{
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Update a review"
curl -X PUT http://localhost:8087/businesses/reviews/0/0 -d '{
    "review": "Updated review!"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Update a review FAIL review doesnt exist"
curl -X PUT http://localhost:8087/businesses/reviews/0/1 -d '{
    "review": "Updated review!"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Get reviews for a business"
curl -X GET http://localhost:8087/businesses/reviews/0 | json_pp -json_opt pretty,canonical
echo
status "Get reviews for a business FAIL business doesnt exist"
curl -X GET http://localhost:8087/businesses/reviews/1 | json_pp -json_opt pretty,canonical
echo
status "Get reviews by a user"
curl -X GET http://localhost:8087/users/reviews/2 | json_pp -json_opt pretty,canonical
echo
status "Get reviews by a user FAIL user doesnt exist"
curl -X GET http://localhost:8087/users/reviews/1 | json_pp -json_opt pretty,canonical
echo
status "Post a photo for a business"
curl -X POST http://localhost:8087/businesses/photos -d '{
    "business_id": "0",
    "link": "http://example.com/image.jpg",
    "description": "Delicious pizza!"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Post a photo for a business FAIL missing param"
curl -X POST http://localhost:8087/businesses/photos -d '{
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Update a photo"
curl -X PUT http://localhost:8087/businesses/photos/0/0 -d '{
    "description": "New description"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
status "Get specific photo from business"
curl -X GET http://localhost:8087/businesses/photos/0/0 | json_pp -json_opt pretty,canonical
echo
status "Get photos from a business"
curl -X GET http://localhost:8087/businesses/photos/0 | json_pp -json_opt pretty,canonical
echo
status "Delete a photo"
curl -X DELETE http://localhost:8087/businesses/photos/0/0 | json_pp -json_opt pretty,canonical
echo
status "Delete a review"
curl -X DELETE http://localhost:8087/businesses/reviews/0/0 | json_pp -json_opt pretty,canonical
echo
status "Delete a business"
curl -X DELETE http://localhost:8087/businesses/0 | json_pp -json_opt pretty,canonical
echo
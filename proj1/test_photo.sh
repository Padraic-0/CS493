#!/bin/bash

status() {
    printf "\n=====================================================\n"
    printf "%s\n" "$1"
    printf -- "-----------------------------------------------------\n"
}

status "Reset Database"
curl -X DELETE http://localhost:8087/api/reset -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 5

status "Create a new user"
curl -X POST http://localhost:8087/users/new -d '{
    "firstname": "Paddy",
    "lastname": "Bergin",
    "password": "password"

}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo

status "Login users"
response=$(curl -s -X POST http://localhost:8087/login -H "Content-Type: application/json" -d '{"username": "PaddyBergin","password": "password"}')
token1=$(echo $response | jq -r '.token')

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
    "owner": "Paddy",
    "website": "www.pizza.com"
}' -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Post a photo for a business"
curl -X POST http://localhost:8087/businesses/photos \
    -F "business_id=1" \
    -F "user_id=1" \
    -F "description=nice pizza" \
    -F "photo=@bajormi_valley.jpg" -H "Authorization: Bearer $token1" -H "Content-Type: multipart/form-data" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get Photo by Id"
curl -X GET http://localhost:8087/businesses/photos/1 -o downloaded_photo.jpg
echo
sleep 0.5

echo $token1
status "Update Photo"
curl -X PUT http://localhost:8087/businesses/photos/1 -d '{
    "description": "Actually not a pizza"
}' -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get photos of business"
curl -X GET http://localhost:8087/businesses/photos/all/1 -H "Content-Type: application/json"| json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Delete photo by id"
curl -X DELETE http://localhost:8087/businesses/photos/1  -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
#!/bin/bash
export HOST='localhost'
random_number=$((1 + RANDOM % 100))

status() {
    printf "\n=====================================================\n"
    printf "%s\n" "$1"
    printf -- "-----------------------------------------------------\n"
}

status "Reset Database"
curl -X DELETE http://localhost:8087/api/reset -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 5

status "Change rate limit for testing"
curl -X POST http://localhost:8087/api/ratelimit -d '{
    "limit": "1000"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 0.5


status "Create a new user"
curl -X POST http://localhost:8087/users/new -d '{
    "firstname": "Paddy",
    "lastname": "Bergin",
    "password": "password"

}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Create a second new user"
curl -X POST http://localhost:8087/users/new -d '{
    "firstname": "Not Paddy",
    "lastname": "Bergin",
    "password": "password"

}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Login users"
response=$(curl -s -X POST http://localhost:8087/login -H "Content-Type: application/json" -d '{"username": "PaddyBergin","password": "password"}')
token1=$(echo $response | jq -r '.token')

response2=$(curl -s -X POST http://localhost:8087/login -H "Content-Type: application/json" -d '{"username": "Not PaddyBergin","password": "password"}')
token2=$(echo $response2 | jq -r '.token')
echo $response2 | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "get user by id as that user"
curl -X GET http://localhost:8087/users/1 -H "Authorization: Bearer $token1" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "get user by id NOT as that user"
curl -X GET http://localhost:8087/users/1 -H "Authorization: Bearer $token2" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

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

status "Create a few more businesses"
for i in {1..12}
do
    sleep 1
    curl -s -X POST http://localhost:8087/businesses -d "{
        \"name\": \"Paddys Pizza $i\",
        \"address\": \"123 Main St\",
        \"city\": \"Bend\",
        \"state\": \"OR\",
        \"zip\": \"97701\",
        \"phone\": \"541-555-1234\",
        \"category\": \"Pizza\",
        \"subcategories\": \"Microwaved\",
        \"owner_id\": \"1\",
        \"owner\": \"Paddy\",
        \"website\": \"www.pizza.com\"
    }" -H "Authorization: Bearer $token1" -H "Content-Type: application/json" >> /dev/null
done
echo

status "Update an existing business"
curl -X PUT http://localhost:8087/businesses/1 -d '{
    "owner_id": "1",
    "name": "Paddys New Pizza Place"
}' -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Update an existing business FAIL missing param"
curl -X PUT http://localhost:8087/businesses/1 -d '{
    "name": "Paddys New Pizza Place"
}' -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get a business"
curl -X GET http://localhost:8087/businesses/1 | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get a business FAIL doesnt exisit"
curl -X GET http://localhost:8087/businesses/0 | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get all businesses"
curl -X GET http://localhost:8087/businesses | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Post a review for a business"
curl -X POST http://localhost:8087/businesses/reviews -d '{
    "business_id": "1",
    "author": "John Doe",
    "author_id": "2",
    "review": "Great pizza!",
    "star_rating": "5",
    "cost": "$$"
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Post a review for a business FAIL only one review allowed"
curl -X POST http://localhost:8087/businesses/reviews -d '{
    "business_id": "1",
    "author": "John Doe",
    "author_id": "2",
    "review": "Great pizza!",
    "star_rating": "5",
    "cost": "$$"
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Post a review for a business FAIL missing param"
curl -X POST http://localhost:8087/businesses/reviews -d '{
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Update a review"
curl -X PUT http://localhost:8087/businesses/reviews/1 -d '{
    "review": "Updated review!"
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Update a review FAIL review doesnt exist"
curl -X PUT http://localhost:8087/businesses/reviews/2 -d '{
    "review": "Updated review!"
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get reviews for a business"
curl -X GET http://localhost:8087/businesses/reviews/1 | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get reviews for a business FAIL business doesnt exist"
curl -X GET http://localhost:8087/businesses/reviews/0 | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get reviews by a user"
curl -X GET http://localhost:8087/users/reviews/2 -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get reviews by a user FAIL user doesnt exist"
curl -X GET http://localhost:8087/users/reviews/0 -H "Authorization: Bearer $token2" -H "Content-Type: application/json"| json_pp -json_opt pretty,canonical
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

status "Post a photo for a business FAIL missing param"
curl -X POST http://localhost:8087/businesses/photos -d '{
}' -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Update Photo"
curl -X PUT http://localhost:8087/businesses/photos/1 -d '{
    "description": "Actually not a pizza"
}' -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Get Photo by Id"
curl -X GET http://localhost:8087/businesses/photos/1 -o downloaded_photo.jpg
echo
sleep 0.5

status "Get Photo Thumbnail by Id"
curl -X GET http://localhost:8087/businesses/photos/thumbnail/1 -o downloaded_thumbnail.jpg
echo
sleep 0.5

status "Get photos of business"
curl -X GET http://localhost:8087/businesses/photos/all/1 -H "Content-Type: application/json"| json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Delete photo by id"
curl -X DELETE http://localhost:8087/businesses/photos/1  -H "Authorization: Bearer $token1" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo

status "Delete a review"
curl -X DELETE http://localhost:8087/businesses/reviews/1 -H "Authorization: Bearer $token2" -H "Content-Type: application/json" | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Delete a business"
curl -X DELETE http://localhost:8087/businesses/1 -H "Authorization: Bearer $token1" -H "Content-Type: application/json"| json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "Change rate limit for testing"
curl -X POST http://localhost:8087/api/ratelimit -d '{
    "limit": "0.00000001"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 0.5

status "rate limit"
message="no" 
while [ "$message" != "bad limit" ]
do
    response=$(curl -s -X GET http://localhost:8087/businesses/1)
    echo "response: $response"
    message=$(echo $response | jq -r '.message')
    echo "message: $message"
done

status "Change rate limit for testing"
curl -X POST http://localhost:8087/api/ratelimit -d '{
    "limit": "2000"
}' -H 'Content-Type: application/json' | json_pp -json_opt pretty,canonical
echo
sleep 0.5
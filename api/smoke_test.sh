#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
JQ=${JQ:-jq}

echo "Running basic smoke tests against $API"

# create teacher
echo "Registering teacher..."
curl -s -X POST $API/auth/register -H "Content-Type: application/json" -d '{"email":"teacher@example.com","password":"secret123","role":"teacher"}' | $JQ .

echo "Logging in teacher..."
RESP=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"teacher@example.com","password":"secret123"}')
TOKEN=$(echo "$RESP" | $JQ -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then echo "Login failed"; exit 1; fi
echo "Got token: ${TOKEN:0:10}..."

# create group
RESP=$(curl -s -X POST $API/groups -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Smoke Group"}')
echo "$RESP" | $JQ .
GROUP_CODE=$(echo "$RESP" | $JQ -r '.group.code')

# create test
RESP=$(curl -s -X POST $API/tests -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"name\":\"Smoke Test\",\"group_code\":\"$GROUP_CODE\"}")
echo "$RESP" | $JQ .
TEST_CODE=$(echo "$RESP" | $JQ -r '.test.code')

# create section
RESP=$(curl -s -X POST $API/sections -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"name\":\"S1\",\"test_code\":\"$TEST_CODE\"}")
echo "$RESP" | $JQ .
SECTION_ID=$(echo "$RESP" | $JQ -r '.section.id')

# create items
RESP=$(curl -s -X POST $API/items -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"question\":\"2+2?\",\"answer\":\"4\",\"type\":\"mcq\",\"pts\":1,\"section_id\":$SECTION_ID}")
echo "$RESP" | $JQ .
ITEM1_ID=$(echo "$RESP" | $JQ -r '.item.id')

RESP=$(curl -s -X POST $API/items -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"question\":\"Select primes\",\"answer\":\"[\\\"2\\\",\\\"3\\\"]\",\"type\":\"select-multiple\",\"pts\":2,\"section_id\":$SECTION_ID}")
echo "$RESP" | $JQ .
ITEM2_ID=$(echo "$RESP" | $JQ -r '.item.id')

# create student
curl -s -X POST $API/auth/register -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"studpass","role":"student"}' | $JQ .
RESP=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"studpass"}')
STUDENT_TOKEN=$(echo "$RESP" | $JQ -r '.token')
STUDENT_ID=$(echo "$RESP" | $JQ -r '.user.id')

echo "Submitting answers..."
RESP=$(curl -s -X POST $API/answers -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" -d "{\"user_id\":$STUDENT_ID,\"test_code\":\"$TEST_CODE\",\"responses\":[{\"item_id\":$ITEM1_ID,\"answer\":\"4\"},{\"item_id\":$ITEM2_ID,\"answer\":[\"2\",\"3\"]}]}")
echo "$RESP" | $JQ .

echo "Smoke tests completed successfully."